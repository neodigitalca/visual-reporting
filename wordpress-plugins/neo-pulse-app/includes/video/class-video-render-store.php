<?php
/**
 * Video render state on disk: {uploads}/neo-pulse-video/{renderId}/render.json plus frames and clips.
 *
 * @package Neo_Pulse_App
 */

defined( 'ABSPATH' ) || exit;

class Neo_Pulse_App_Video_Render_Store {

	const SUBDIR = 'neo-pulse-video';

	public static function new_id(): string {
		return gmdate( 'Ymd-His' ) . '-' . wp_generate_password( 8, false, false );
	}

	public static function valid_id( string $id ): bool {
		return (bool) preg_match( '/^[0-9]{8}-[0-9]{6}-[A-Za-z0-9]{8}$/', $id );
	}

	public static function dir( string $id ): string {
		$upload = wp_upload_dir();
		return trailingslashit( (string) ( $upload['basedir'] ?? '' ) ) . self::SUBDIR . '/' . $id;
	}

	public static function url( string $id, string $file ): string {
		$upload = wp_upload_dir();
		return trailingslashit( (string) ( $upload['baseurl'] ?? '' ) ) . self::SUBDIR . '/' . $id . '/' . $file;
	}

	public static function clip_path( string $id, int $order ): string {
		return self::dir( $id ) . '/scene-' . str_pad( (string) $order, 2, '0', STR_PAD_LEFT ) . '.mp4';
	}

	public static function voice_path( string $id, int $order ): string {
		return self::dir( $id ) . '/voice-' . str_pad( (string) $order, 2, '0', STR_PAD_LEFT ) . '.pcm';
	}

	/** Last frame of the previous clip, used as the first frame of a `continue` scene. */
	public static function chain_frame_path( string $id, int $order ): string {
		return self::dir( $id ) . '/chain-' . str_pad( (string) $order, 2, '0', STR_PAD_LEFT ) . '.png';
	}

	public static function final_path( string $id ): string {
		return self::dir( $id ) . '/final.mp4';
	}

	/**
	 * @param array<string,mixed> $render
	 * @return true|WP_Error
	 */
	public static function create( array $render ) {
		$dir = self::dir( (string) $render['id'] );
		if ( ! wp_mkdir_p( $dir ) ) {
			return new WP_Error( 'neo-pulse_video_store', 'Could not create render folder ' . $dir );
		}
		return self::write( (string) $render['id'], $render );
	}

	/**
	 * @return array<string,mixed>|null
	 */
	public static function read( string $id ): ?array {
		$path = self::dir( $id ) . '/render.json';
		if ( ! is_file( $path ) ) {
			return null;
		}
		$json = json_decode( (string) file_get_contents( $path ), true );
		return is_array( $json ) ? $json : null;
	}

	/**
	 * @param array<string,mixed> $render
	 * @return true|WP_Error
	 */
	public static function write( string $id, array $render ) {
		$path = self::dir( $id ) . '/render.json';
		$fh   = fopen( $path, 'c+' );
		if ( ! $fh ) {
			return new WP_Error( 'neo-pulse_video_store', 'Could not open ' . $path );
		}
		flock( $fh, LOCK_EX );
		ftruncate( $fh, 0 );
		rewind( $fh );
		fwrite( $fh, (string) wp_json_encode( $render, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) );
		fflush( $fh );
		flock( $fh, LOCK_UN );
		fclose( $fh );
		return true;
	}

	/**
	 * Client-facing snapshot (matches VideoRenderSnapshot in the app).
	 *
	 * @param array<string,mixed> $render
	 * @return array<string,mixed>
	 */
	public static function snapshot( array $render ): array {
		$scenes = array();
		foreach ( (array) $render['scenes'] as $scene ) {
			$row = array(
				'sceneId' => (string) $scene['id'],
				'status'  => (string) $scene['status'],
			);
			if ( ! empty( $scene['clipFile'] ) ) {
				$row['clipUrl'] = self::url( (string) $render['id'], (string) $scene['clipFile'] );
			}
			if ( ! empty( $scene['error'] ) ) {
				$row['error'] = (string) $scene['error'];
			}
			$scenes[] = $row;
		}
		$out = array(
			'id'     => (string) $render['id'],
			'status' => (string) $render['status'],
			'scenes' => $scenes,
		);
		if ( ! empty( $render['finalFile'] ) ) {
			$out['finalUrl'] = self::url( (string) $render['id'], (string) $render['finalFile'] );
		}
		if ( ! empty( $render['error'] ) ) {
			$out['error'] = (string) $render['error'];
		}
		return $out;
	}
}
