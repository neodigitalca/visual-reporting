<?php
/**
 * OpenRouter text-to-speech (HeyGen Voice): one narration file per scene.
 *
 * @package Neo_Pulse_App
 */

defined( 'ABSPATH' ) || exit;

class Neo_Pulse_App_Openrouter_Speech {

	const SPEECH_URL = 'https://openrouter.ai/api/v1/audio/speech';

	/**
	 * Synthesize `$text` with `$voice` as 16-bit PCM at `$out_path` (HeyGen Voice returns pcm only).
	 * Returns the sample rate and channel count read from the response content type.
	 *
	 * @return array{rate:int,channels:int}|WP_Error
	 */
	public static function synthesize( string $api_key, string $model, string $voice, string $text, string $out_path ) {
		$response = wp_remote_post(
			self::SPEECH_URL,
			array(
				'timeout'  => 120,
				'stream'   => true,
				'filename' => $out_path,
				'headers'  => Neo_Pulse_App_Openrouter_Attribution::request_headers( $api_key ),
				'body'     => wp_json_encode(
					array(
						'model'           => $model,
						'input'           => $text,
						'voice'           => $voice,
						'response_format' => 'pcm',
					)
				),
			)
		);
		if ( is_wp_error( $response ) ) {
			@unlink( $out_path );
			return $response;
		}
		$code = (int) wp_remote_retrieve_response_code( $response );
		if ( $code < 200 || $code >= 300 ) {
			$body = is_file( $out_path ) ? (string) file_get_contents( $out_path ) : '';
			@unlink( $out_path );
			$json = json_decode( $body, true );
			$msg  = is_array( $json ) ? (string) ( $json['error']['message'] ?? $json['message'] ?? 'OpenRouter speech error' ) : 'OpenRouter speech error';
			return new WP_Error( 'neo-pulse_openrouter_speech', 'OpenRouter ' . $code . ': ' . $msg );
		}
		if ( ! is_file( $out_path ) || filesize( $out_path ) < 1024 ) {
			@unlink( $out_path );
			return new WP_Error( 'neo-pulse_openrouter_speech', 'OpenRouter speech returned an empty audio file' );
		}
		$type = (string) wp_remote_retrieve_header( $response, 'content-type' );
		if ( ! preg_match( '/rate=(\d+)/', $type, $rate ) || ! preg_match( '/channels=(\d+)/', $type, $channels ) ) {
			@unlink( $out_path );
			return new WP_Error( 'neo-pulse_openrouter_speech', 'OpenRouter speech did not report the PCM rate and channels (content-type: ' . $type . ')' );
		}
		return array(
			'rate'     => (int) $rate[1],
			'channels' => (int) $channels[1],
		);
	}
}
