<?php
/**
 * /api/video/* routes: create render, upload storyboard frames, start (narration + clip jobs), poll (chain, assemble).
 *
 * @package Neo_Pulse_App
 */

defined( 'ABSPATH' ) || exit;

class Neo_Pulse_App_Video_Route_Handlers {

	const SCENE_MIN_SECONDS = 5;
	const SCENE_MAX_SECONDS = 15;
	const DISSOLVE_MIN      = 0.5;
	const DISSOLVE_MAX      = 1.0;
	const TICK_LOCK_TTL     = 120;

	/**
	 * @param array<string,mixed> $body
	 */
	public static function dispatch_http( string $subpath, string $method, array $body ): void {
		$subpath = trim( $subpath, '/' );
		$method  = strtoupper( $method );

		if ( 0 === strpos( $subpath, 'brainstorm/' ) ) {
			Neo_Pulse_App_Video_Brainstorm::dispatch_http( substr( $subpath, 11 ), $method, $body );
			return;
		}
		if ( $subpath === 'render' && $method === 'POST' ) {
			self::send( self::create( $body ) );
			return;
		}
		if ( preg_match( '#^render/([A-Za-z0-9-]+)/frame$#', $subpath, $m ) && $method === 'POST' ) {
			self::send( self::upload_frame( $m[1], $body ) );
			return;
		}
		if ( preg_match( '#^render/([A-Za-z0-9-]+)/start$#', $subpath, $m ) && $method === 'POST' ) {
			self::send( self::start( $m[1] ) );
			return;
		}
		if ( preg_match( '#^render/([A-Za-z0-9-]+)$#', $subpath, $m ) && $method === 'GET' ) {
			self::send( self::poll( $m[1] ) );
			return;
		}
		Neo_Pulse_App_Api_Dispatcher::send_json( array( 'ok' => false, 'error' => 'Not found' ), 404 );
	}

	/**
	 * @param array<string,mixed>|WP_Error $result
	 */
	private static function send( $result ): void {
		if ( is_wp_error( $result ) ) {
			$status = (int) ( $result->get_error_data()['status'] ?? 500 );
			Neo_Pulse_App_Api_Dispatcher::send_json( array( 'ok' => false, 'error' => $result->get_error_message() ), $status );
			return;
		}
		Neo_Pulse_App_Api_Dispatcher::send_json( array_merge( array( 'ok' => true ), $result ) );
	}

	private static function bad_request( string $message ): WP_Error {
		return new WP_Error( 'neo-pulse_video', $message, array( 'status' => 400 ) );
	}

	/**
	 * @return array<string,mixed>|WP_Error
	 */
	private static function load( string $id ) {
		if ( ! Neo_Pulse_App_Video_Render_Store::valid_id( $id ) ) {
			return self::bad_request( 'Invalid render id' );
		}
		$render = Neo_Pulse_App_Video_Render_Store::read( $id );
		if ( $render === null ) {
			return new WP_Error( 'neo-pulse_video', 'Render not found', array( 'status' => 404 ) );
		}
		return $render;
	}

	/**
	 * @param mixed $raw transitionIn from the client.
	 * @return array{type:string,seconds:float}|WP_Error
	 */
	private static function parse_transition( $raw, int $index ) {
		if ( ! is_array( $raw ) ) {
			return self::bad_request( 'scenes[' . $index . '] needs transitionIn' );
		}
		$type    = isset( $raw['type'] ) ? trim( (string) $raw['type'] ) : '';
		$seconds = isset( $raw['seconds'] ) ? (float) $raw['seconds'] : 0.0;
		if ( $type === 'continue' ) {
			return array( 'type' => 'continue', 'seconds' => 0.0 );
		}
		if ( $type === 'dissolve' ) {
			if ( $seconds < self::DISSOLVE_MIN || $seconds > self::DISSOLVE_MAX ) {
				return self::bad_request( 'scenes[' . $index . '] dissolve must be ' . self::DISSOLVE_MIN . '..' . self::DISSOLVE_MAX . ' s' );
			}
			return array( 'type' => 'dissolve', 'seconds' => round( $seconds, 1 ) );
		}
		return self::bad_request( 'scenes[' . $index . '] transitionIn.type must be continue or dissolve' );
	}

	/**
	 * POST video/render  {model, resolution, aspectRatio, voiceModel, voice, scenes:[{id, order, durationSeconds, videoPrompt, narration, transitionIn?}]}
	 * voice "none" renders without a narration track; every scene narration is then "". A HeyGen voice needs narration on every scene.
	 *
	 * @param array<string,mixed> $body
	 * @return array<string,mixed>|WP_Error
	 */
	private static function create( array $body ) {
		$model       = isset( $body['model'] ) ? trim( (string) $body['model'] ) : '';
		$resolution  = isset( $body['resolution'] ) ? trim( (string) $body['resolution'] ) : '';
		$aspect      = isset( $body['aspectRatio'] ) ? trim( (string) $body['aspectRatio'] ) : '';
		$voice_model = isset( $body['voiceModel'] ) ? trim( (string) $body['voiceModel'] ) : '';
		$voice       = isset( $body['voice'] ) ? trim( (string) $body['voice'] ) : '';
		$scenes_in   = isset( $body['scenes'] ) && is_array( $body['scenes'] ) ? array_values( $body['scenes'] ) : array();
		if ( $model === '' || $resolution === '' || $aspect === '' || $voice_model === '' || $voice === '' ) {
			return self::bad_request( 'model, resolution, aspectRatio, voiceModel and voice are required' );
		}
		if ( ! $scenes_in ) {
			return self::bad_request( 'scenes must not be empty' );
		}
		$scenes = array();
		foreach ( $scenes_in as $i => $scene ) {
			if ( ! is_array( $scene ) ) {
				return self::bad_request( 'scenes[' . $i . '] is invalid' );
			}
			$sid       = isset( $scene['id'] ) ? trim( (string) $scene['id'] ) : '';
			$order     = isset( $scene['order'] ) ? (int) $scene['order'] : 0;
			$duration  = isset( $scene['durationSeconds'] ) ? (int) $scene['durationSeconds'] : 0;
			$prompt    = isset( $scene['videoPrompt'] ) ? trim( (string) $scene['videoPrompt'] ) : '';
			$narration = isset( $scene['narration'] ) ? trim( (string) $scene['narration'] ) : '';
			if ( $sid === '' || $order !== $i + 1 || $prompt === '' ) {
				return self::bad_request( 'scenes[' . $i . '] needs id, sequential order and videoPrompt' );
			}
			if ( ( $voice === 'none' ) !== ( $narration === '' ) ) {
				return self::bad_request( 'scenes[' . $i . ']: narration must be empty when voice is none, and present otherwise' );
			}
			if ( $duration < self::SCENE_MIN_SECONDS || $duration > self::SCENE_MAX_SECONDS ) {
				return self::bad_request( 'scenes[' . $i . '] duration must be ' . self::SCENE_MIN_SECONDS . '..' . self::SCENE_MAX_SECONDS . ' seconds' );
			}
			$transition = null;
			if ( $i === 0 ) {
				if ( isset( $scene['transitionIn'] ) ) {
					return self::bad_request( 'scenes[0] must not have transitionIn' );
				}
			} else {
				$transition = self::parse_transition( $scene['transitionIn'] ?? null, $i );
				if ( is_wp_error( $transition ) ) {
					return $transition;
				}
			}
			$scenes[] = array(
				'id'              => $sid,
				'order'           => $order,
				'durationSeconds' => $duration,
				'videoPrompt'     => $prompt,
				'narration'       => $narration,
				'transition'      => $transition,
				'status'          => 'queued',
				'frameFile'       => '',
				'voiceFile'       => '',
				'voiceRate'       => 0,
				'voiceChannels'   => 0,
				'jobId'           => '',
				'clipFile'        => '',
				'error'           => '',
			);
		}
		$render = array(
			'id'         => Neo_Pulse_App_Video_Render_Store::new_id(),
			'status'     => 'created',
			'model'      => $model,
			'resolution' => $resolution,
			'aspect'     => $aspect,
			'voiceModel' => $voice_model,
			'voice'      => $voice,
			'scenes'     => $scenes,
			'finalFile'  => '',
			'error'      => '',
			'createdAt'  => gmdate( 'c' ),
		);
		$saved = Neo_Pulse_App_Video_Render_Store::create( $render );
		if ( is_wp_error( $saved ) ) {
			return $saved;
		}
		return array( 'id' => $render['id'] );
	}

	/**
	 * POST video/render/{id}/frame  {sceneId, dataUrl}
	 *
	 * @param array<string,mixed> $body
	 * @return array<string,mixed>|WP_Error
	 */
	private static function upload_frame( string $id, array $body ) {
		$render = self::load( $id );
		if ( is_wp_error( $render ) ) {
			return $render;
		}
		if ( $render['status'] !== 'created' ) {
			return self::bad_request( 'Frames can only be uploaded before the render starts' );
		}
		$scene_id = isset( $body['sceneId'] ) ? trim( (string) $body['sceneId'] ) : '';
		$data_url = isset( $body['dataUrl'] ) ? trim( (string) $body['dataUrl'] ) : '';
		if ( ! preg_match( '#^data:(image/(png|jpeg|webp));base64,(.+)$#s', $data_url, $m ) ) {
			return self::bad_request( 'dataUrl must be a base64 PNG, JPEG or WebP data URL' );
		}
		$raw = base64_decode( $m[3], true );
		if ( $raw === false || strlen( $raw ) < 1024 ) {
			return self::bad_request( 'dataUrl is not valid base64 image data' );
		}
		$ext = $m[2] === 'jpeg' ? 'jpg' : $m[2];
		foreach ( $render['scenes'] as &$scene ) {
			if ( $scene['id'] !== $scene_id ) {
				continue;
			}
			$file = 'scene-' . str_pad( (string) $scene['order'], 2, '0', STR_PAD_LEFT ) . '.' . $ext;
			if ( file_put_contents( Neo_Pulse_App_Video_Render_Store::dir( $id ) . '/' . $file, $raw ) === false ) {
				return new WP_Error( 'neo-pulse_video', 'Could not write frame file' );
			}
			$scene['frameFile'] = $file;
			unset( $scene );
			$saved = Neo_Pulse_App_Video_Render_Store::write( $id, $render );
			return is_wp_error( $saved ) ? $saved : array();
		}
		return self::bad_request( 'Unknown sceneId ' . $scene_id );
	}

	/**
	 * POST video/render/{id}/start: preflight ffmpeg and frames, synthesize narration, then submit scene 1 and every dissolve scene.
	 * `continue` scenes wait for the previous clip's last frame (see tick).
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	private static function start( string $id ) {
		$render = self::load( $id );
		if ( is_wp_error( $render ) ) {
			return $render;
		}
		if ( $render['status'] !== 'created' ) {
			return self::bad_request( 'Render already started' );
		}
		$api_key = Neo_Pulse_App_Openrouter_Image::resolve_key();
		if ( $api_key === '' ) {
			return self::bad_request( 'OpenRouter API key is missing' );
		}
		$preflight = Neo_Pulse_App_Video_Stitch::preflight();
		if ( is_wp_error( $preflight ) ) {
			return $preflight;
		}
		foreach ( $render['scenes'] as $scene ) {
			if ( $scene['frameFile'] === '' ) {
				return self::bad_request( 'Scene ' . $scene['order'] . ' has no storyboard frame' );
			}
		}

		foreach ( $render['scenes'] as &$scene ) {
			if ( $scene['narration'] === '' ) {
				continue;
			}
			$voice_path = Neo_Pulse_App_Video_Render_Store::voice_path( $id, (int) $scene['order'] );
			$tts        = Neo_Pulse_App_Openrouter_Speech::synthesize(
				$api_key,
				(string) $render['voiceModel'],
				(string) $render['voice'],
				(string) $scene['narration'],
				$voice_path
			);
			if ( is_wp_error( $tts ) ) {
				return new WP_Error( 'neo-pulse_video', 'Scene ' . $scene['order'] . ' narration failed: ' . $tts->get_error_message() );
			}
			$scene['voiceFile']     = basename( $voice_path );
			$scene['voiceRate']     = $tts['rate'];
			$scene['voiceChannels'] = $tts['channels'];
		}
		unset( $scene );

		$dir = Neo_Pulse_App_Video_Render_Store::dir( $id );
		foreach ( $render['scenes'] as &$scene ) {
			if ( is_array( $scene['transition'] ) && $scene['transition']['type'] === 'continue' ) {
				continue;
			}
			self::submit_scene( $api_key, $render, $scene, $dir . '/' . $scene['frameFile'] );
		}
		unset( $scene );

		$render['status'] = 'rendering';
		self::settle_failures( $render );
		$saved = Neo_Pulse_App_Video_Render_Store::write( $id, $render );
		if ( is_wp_error( $saved ) ) {
			return $saved;
		}
		return array( 'render' => Neo_Pulse_App_Video_Render_Store::snapshot( $render ) );
	}

	/**
	 * Submit one clip job from `$frame_path`; marks the scene generating or failed.
	 *
	 * @param array<string,mixed> $render
	 * @param array<string,mixed> $scene
	 */
	private static function submit_scene( string $api_key, array $render, array &$scene, string $frame_path ): void {
		$ext  = pathinfo( $frame_path, PATHINFO_EXTENSION );
		$mime = $ext === 'jpg' ? 'image/jpeg' : 'image/' . $ext;
		$job  = Neo_Pulse_App_Openrouter_Video::submit(
			$api_key,
			array(
				'model'             => (string) $render['model'],
				'prompt'            => (string) $scene['videoPrompt'],
				'duration'          => (int) $scene['durationSeconds'],
				'resolution'        => (string) $render['resolution'],
				'aspectRatio'       => (string) $render['aspect'],
				'firstFrameDataUrl' => 'data:' . $mime . ';base64,' . base64_encode( (string) file_get_contents( $frame_path ) ),
			)
		);
		if ( is_wp_error( $job ) ) {
			$scene['status'] = 'failed';
			$scene['error']  = $job->get_error_message();
			return;
		}
		$scene['status'] = 'generating';
		$scene['jobId']  = $job['id'];
	}

	/**
	 * GET video/render/{id}: advance jobs under a lock, chain continue scenes, assemble when every clip is on disk.
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	private static function poll( string $id ) {
		$render = self::load( $id );
		if ( is_wp_error( $render ) ) {
			return $render;
		}
		if ( $render['status'] !== 'rendering' ) {
			return array( 'render' => Neo_Pulse_App_Video_Render_Store::snapshot( $render ) );
		}
		$lock = 'neo_pulse_video_tick_' . $id;
		if ( get_transient( $lock ) ) {
			return array( 'render' => Neo_Pulse_App_Video_Render_Store::snapshot( $render ) );
		}
		set_transient( $lock, 1, self::TICK_LOCK_TTL );
		try {
			$render = self::tick( $render );
		} finally {
			delete_transient( $lock );
		}
		return array( 'render' => Neo_Pulse_App_Video_Render_Store::snapshot( $render ) );
	}

	/**
	 * @param array<string,mixed> $render
	 * @return array<string,mixed>
	 */
	private static function tick( array $render ): array {
		$id      = (string) $render['id'];
		$api_key = Neo_Pulse_App_Openrouter_Image::resolve_key();
		if ( $api_key === '' ) {
			$render['status'] = 'failed';
			$render['error']  = 'OpenRouter API key is missing';
			Neo_Pulse_App_Video_Render_Store::write( $id, $render );
			return $render;
		}

		$count = count( $render['scenes'] );
		for ( $i = 0; $i < $count; $i++ ) {
			$scene = &$render['scenes'][ $i ];
			if ( $scene['status'] !== 'generating' ) {
				unset( $scene );
				continue;
			}
			$status = Neo_Pulse_App_Openrouter_Video::status( $api_key, (string) $scene['jobId'] );
			if ( is_wp_error( $status ) ) {
				$scene['status'] = 'failed';
				$scene['error']  = $status->get_error_message();
				unset( $scene );
				continue;
			}
			if ( $status['status'] === 'completed' ) {
				if ( $status['unsignedUrl'] === '' ) {
					$scene['status'] = 'failed';
					$scene['error']  = 'OpenRouter completed the job without a download URL';
					unset( $scene );
					continue;
				}
				$clip = Neo_Pulse_App_Video_Render_Store::clip_path( $id, (int) $scene['order'] );
				$dl   = Neo_Pulse_App_Openrouter_Video::download( $api_key, $status['unsignedUrl'], $clip );
				if ( is_wp_error( $dl ) ) {
					$scene['status'] = 'failed';
					$scene['error']  = $dl->get_error_message();
					unset( $scene );
					continue;
				}
				$scene['status']   = 'done';
				$scene['clipFile'] = basename( $clip );
				unset( $scene );
				self::chain_next( $api_key, $render, $i, $clip );
				continue;
			}
			if ( in_array( $status['status'], array( 'failed', 'cancelled', 'expired' ), true ) ) {
				$scene['status'] = 'failed';
				$scene['error']  = $status['error'] !== '' ? $status['error'] : 'OpenRouter job ' . $status['status'];
			}
			unset( $scene );
		}

		if ( ! self::settle_failures( $render ) ) {
			$pending = array_filter( $render['scenes'], static fn( $s ) => $s['status'] !== 'done' );
			if ( ! $pending ) {
				$render['status'] = 'stitching';
				Neo_Pulse_App_Video_Render_Store::write( $id, $render );
				$segments = array();
				foreach ( $render['scenes'] as $s ) {
					$segments[] = array(
						'clip'          => Neo_Pulse_App_Video_Render_Store::clip_path( $id, (int) $s['order'] ),
						'voice'         => $s['voiceFile'] === '' ? '' : Neo_Pulse_App_Video_Render_Store::voice_path( $id, (int) $s['order'] ),
						'voiceRate'     => (int) $s['voiceRate'],
						'voiceChannels' => (int) $s['voiceChannels'],
						'transition'    => $s['transition'],
					);
				}
				$out      = Neo_Pulse_App_Video_Render_Store::final_path( $id );
				$assemble = Neo_Pulse_App_Video_Stitch::assemble( $segments, $out );
				if ( is_wp_error( $assemble ) ) {
					$render['status'] = 'failed';
					$render['error']  = $assemble->get_error_message();
				} else {
					$render['status']    = 'done';
					$render['finalFile'] = basename( $out );
				}
			}
		}
		Neo_Pulse_App_Video_Render_Store::write( $id, $render );
		return $render;
	}

	/**
	 * Scene `$index` just finished: when the next scene is a queued `continue`, submit it from this clip's last frame.
	 *
	 * @param array<string,mixed> $render
	 */
	private static function chain_next( string $api_key, array &$render, int $index, string $clip ): void {
		if ( ! isset( $render['scenes'][ $index + 1 ] ) ) {
			return;
		}
		$next = &$render['scenes'][ $index + 1 ];
		if ( $next['status'] !== 'queued' || ! is_array( $next['transition'] ) || $next['transition']['type'] !== 'continue' ) {
			unset( $next );
			return;
		}
		$frame = Neo_Pulse_App_Video_Render_Store::chain_frame_path( (string) $render['id'], (int) $next['order'] );
		$grab  = Neo_Pulse_App_Video_Stitch::last_frame( $clip, $frame );
		if ( is_wp_error( $grab ) ) {
			$next['status'] = 'failed';
			$next['error']  = 'Could not read the last frame of scene ' . ( $index + 1 ) . ': ' . $grab->get_error_message();
			unset( $next );
			return;
		}
		self::submit_scene( $api_key, $render, $next, $frame );
		unset( $next );
	}

	/**
	 * One failed scene fails the render (no partial videos). Returns true when failed.
	 *
	 * @param array<string,mixed> $render
	 */
	private static function settle_failures( array &$render ): bool {
		foreach ( $render['scenes'] as $scene ) {
			if ( $scene['status'] === 'failed' ) {
				$render['status'] = 'failed';
				$render['error']  = 'Scene ' . $scene['order'] . ' failed: ' . $scene['error'];
				return true;
			}
		}
		return false;
	}
}
