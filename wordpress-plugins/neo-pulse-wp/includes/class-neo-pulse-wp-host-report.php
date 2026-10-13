<?php
/**
 * Pulse Host report endpoint: PHP/WP versions, storage, plugin and theme inventory, cache purge.
 * Authenticated with the per-environment PULSE_HOST_REPORT_TOKEN (env or constant).
 *
 * @package Neo_Pulse_WP
 */

defined( 'ABSPATH' ) || exit;

class Neo_Pulse_Wp_Host_Report {

	const REST_NAMESPACE = 'neo-pulse/v1';

	public static function init(): void {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	public static function register_routes(): void {
		register_rest_route(
			self::REST_NAMESPACE,
			'/host-report',
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'rest_report' ),
				'permission_callback' => array( __CLASS__, 'permission' ),
			)
		);
		register_rest_route(
			self::REST_NAMESPACE,
			'/host-report/purge-cache',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'rest_purge_cache' ),
				'permission_callback' => array( __CLASS__, 'permission' ),
			)
		);
	}

	private static function expected_token(): string {
		if ( defined( 'PULSE_HOST_REPORT_TOKEN' ) && is_string( PULSE_HOST_REPORT_TOKEN ) ) {
			return trim( PULSE_HOST_REPORT_TOKEN );
		}
		return trim( (string) getenv( 'PULSE_HOST_REPORT_TOKEN' ) );
	}

	public static function permission( WP_REST_Request $request ): bool {
		$expected = self::expected_token();
		$given    = trim( (string) $request->get_header( 'X-Pulse-Host-Token' ) );
		return $expected !== '' && $given !== '' && hash_equals( $expected, $given );
	}

	public static function rest_report( WP_REST_Request $request ): WP_REST_Response {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/update.php';

		$plugin_updates = get_site_transient( 'update_plugins' );
		$theme_updates  = get_site_transient( 'update_themes' );
		$core_updates   = get_site_transient( 'update_core' );

		$plugins = array();
		foreach ( get_plugins() as $file => $data ) {
			$update = isset( $plugin_updates->response[ $file ]->new_version ) ? (string) $plugin_updates->response[ $file ]->new_version : null;
			$plugins[] = array(
				'slug'          => dirname( $file ) === '.' ? basename( $file, '.php' ) : dirname( $file ),
				'name'          => (string) ( $data['Name'] ?? $file ),
				'version'       => (string) ( $data['Version'] ?? '' ),
				'updateVersion' => $update,
				'active'        => is_plugin_active( $file ),
			);
		}

		$active_theme = wp_get_theme();
		$themes       = array();
		foreach ( wp_get_themes() as $slug => $theme ) {
			$update   = isset( $theme_updates->response[ $slug ]['new_version'] ) ? (string) $theme_updates->response[ $slug ]['new_version'] : null;
			$themes[] = array(
				'slug'          => (string) $slug,
				'name'          => (string) $theme->get( 'Name' ),
				'version'       => (string) $theme->get( 'Version' ),
				'updateVersion' => $update,
				'active'        => $active_theme->get_stylesheet() === $slug,
			);
		}

		$wp_update = null;
		if ( isset( $core_updates->updates ) && is_array( $core_updates->updates ) ) {
			foreach ( $core_updates->updates as $update ) {
				if ( isset( $update->response, $update->version ) && 'upgrade' === $update->response ) {
					$wp_update = (string) $update->version;
					break;
				}
			}
		}

		return new WP_REST_Response(
			array(
				'phpVersion'        => PHP_VERSION,
				'wpVersion'         => get_bloginfo( 'version' ),
				'wpUpdateAvailable' => $wp_update,
				'storageBytes'      => self::directory_bytes( ABSPATH ),
				'plugins'           => $plugins,
				'themes'            => $themes,
				'siteUrl'           => home_url( '/' ),
			),
			200
		);
	}

	public static function rest_purge_cache( WP_REST_Request $request ): WP_REST_Response {
		$result = class_exists( 'Neo_Pulse_Wp_Speed', false ) ? Neo_Pulse_Wp_Speed::flush_all_wordpress() : array();
		wp_cache_flush();
		return new WP_REST_Response( array( 'ok' => true, 'result' => $result ), 200 );
	}

	private static function directory_bytes( string $dir ): int {
		$total = 0;
		$iterator = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $dir, FilesystemIterator::SKIP_DOTS ),
			RecursiveIteratorIterator::LEAVES_ONLY,
			RecursiveIteratorIterator::CATCH_GET_CHILD
		);
		foreach ( $iterator as $file ) {
			if ( $file->isFile() ) {
				$total += (int) $file->getSize();
			}
		}
		return $total;
	}
}
