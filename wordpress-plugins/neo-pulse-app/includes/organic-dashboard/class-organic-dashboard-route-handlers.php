<?php
/**
 * HTTP dispatch for /api/organic-dashboard/*.
 *
 * @package Neo_Pulse_App
 */

defined( 'ABSPATH' ) || exit;

class Neo_Pulse_App_Organic_Dashboard_Route_Handlers {

	/**
	 * @param string              $subpath Route after organic-dashboard/.
	 * @param string              $method  HTTP method.
	 * @param array<string,mixed> $body    JSON body.
	 */
	public static function dispatch_http( string $subpath, string $method, array $body ): void {
		$subpath = trim( $subpath, '/' );
		$method  = strtoupper( $method );

		if ( $subpath === 'fetch' && $method === 'POST' ) {
			$result = Neo_Pulse_App_Organic_Dashboard_Bundle::fetch( $body );
			Neo_Pulse_App_Api_Dispatcher::send_json( $result['body'], $result['statusCode'] );
			return;
		}

		Neo_Pulse_App_Api_Dispatcher::send_json(
			array(
				'error' => 'Not found',
				'path'  => 'organic-dashboard/' . $subpath,
			),
			404
		);
	}
}
