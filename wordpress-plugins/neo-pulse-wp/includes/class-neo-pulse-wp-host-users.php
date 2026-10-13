<?php
/**
 * Pulse Host users endpoints: list, add, change, remove WordPress users on this site.
 * Authenticated with the per-environment PULSE_HOST_REPORT_TOKEN (same as host-report).
 *
 * @package Neo_Pulse_WP
 */

defined( 'ABSPATH' ) || exit;

class Neo_Pulse_Wp_Host_Users {

	const REST_NAMESPACE = 'neo-pulse/v1';
	const ROUTE          = '/host-report/users';

	public static function init(): void {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	public static function register_routes(): void {
		$permission = array( 'Neo_Pulse_Wp_Host_Report', 'permission' );
		register_rest_route(
			self::REST_NAMESPACE,
			self::ROUTE,
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( __CLASS__, 'rest_list' ),
					'permission_callback' => $permission,
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( __CLASS__, 'rest_create' ),
					'permission_callback' => $permission,
				),
			)
		);
		register_rest_route(
			self::REST_NAMESPACE,
			self::ROUTE . '/(?P<id>\d+)',
			array(
				array(
					'methods'             => 'PATCH',
					'callback'            => array( __CLASS__, 'rest_update' ),
					'permission_callback' => $permission,
				),
				array(
					'methods'             => 'DELETE',
					'callback'            => array( __CLASS__, 'rest_delete' ),
					'permission_callback' => $permission,
				),
			)
		);
	}

	public static function rest_list( WP_REST_Request $request ): WP_REST_Response {
		$users = array_map( array( __CLASS__, 'shape' ), get_users( array( 'orderby' => 'ID', 'order' => 'ASC' ) ) );
		return new WP_REST_Response( array( 'ok' => true, 'users' => $users ), 200 );
	}

	public static function rest_create( WP_REST_Request $request ) {
		$body  = (array) $request->get_json_params();
		$email = sanitize_email( (string) ( $body['email'] ?? '' ) );
		$role  = sanitize_key( (string) ( $body['role'] ?? '' ) );
		if ( $email === '' || ! is_email( $email ) ) {
			return self::error( 'A valid email is required.', 400 );
		}
		if ( ! self::role_exists( $role ) ) {
			return self::error( 'Unknown role.', 400 );
		}
		$credential = self::credential( $body );
		if ( is_wp_error( $credential ) ) {
			return $credential;
		}
		$login = sanitize_user( (string) ( $body['login'] ?? '' ), true );
		if ( $login === '' ) {
			$login = sanitize_user( strstr( $email, '@', true ) ?: $email, true );
		}
		$display = sanitize_text_field( (string) ( $body['displayName'] ?? '' ) );

		$user_id = wp_insert_user(
			array(
				'user_login'   => $login,
				'user_email'   => $email,
				'user_pass'    => $credential['password'] ?? wp_generate_password( 32 ),
				'display_name' => $display !== '' ? $display : $login,
				'role'         => $role,
			)
		);
		if ( is_wp_error( $user_id ) ) {
			return self::error( $user_id->get_error_message(), 409 );
		}
		if ( isset( $credential['hash'] ) ) {
			self::write_hash( (int) $user_id, $credential['hash'] );
		}
		return new WP_REST_Response( array( 'ok' => true, 'user' => self::shape( get_user_by( 'id', $user_id ) ) ), 201 );
	}

	public static function rest_update( WP_REST_Request $request ) {
		$user = get_user_by( 'id', (int) $request['id'] );
		if ( ! $user ) {
			return self::error( 'User not found.', 404 );
		}
		$body = (array) $request->get_json_params();
		$data = array( 'ID' => $user->ID );

		if ( isset( $body['role'] ) ) {
			$role = sanitize_key( (string) $body['role'] );
			if ( ! self::role_exists( $role ) ) {
				return self::error( 'Unknown role.', 400 );
			}
			if ( $role !== 'administrator' && self::is_last_administrator( $user ) ) {
				return self::error( 'This is the last administrator on the site.', 409 );
			}
			$data['role'] = $role;
		}
		if ( isset( $body['displayName'] ) ) {
			$data['display_name'] = sanitize_text_field( (string) $body['displayName'] );
		}
		$credential = self::credential( $body );
		if ( is_wp_error( $credential ) ) {
			return $credential;
		}
		if ( isset( $credential['password'] ) ) {
			$data['user_pass'] = $credential['password'];
		}

		$result = wp_update_user( $data );
		if ( is_wp_error( $result ) ) {
			return self::error( $result->get_error_message(), 409 );
		}
		if ( isset( $credential['hash'] ) ) {
			self::write_hash( $user->ID, $credential['hash'] );
		}
		return new WP_REST_Response( array( 'ok' => true, 'user' => self::shape( get_user_by( 'id', $user->ID ) ) ), 200 );
	}

	public static function rest_delete( WP_REST_Request $request ) {
		$user = get_user_by( 'id', (int) $request['id'] );
		if ( ! $user ) {
			return self::error( 'User not found.', 404 );
		}
		$pulse_email = trim( (string) getenv( 'PULSE_ADMIN_EMAIL' ) );
		if ( $pulse_email !== '' && strcasecmp( $user->user_email, $pulse_email ) === 0 ) {
			return self::error( 'The Pulse administrator cannot be removed.', 409 );
		}
		if ( self::is_last_administrator( $user ) ) {
			return self::error( 'This is the last administrator on the site.', 409 );
		}
		require_once ABSPATH . 'wp-admin/includes/user.php';
		$reassign = self::another_administrator_id( $user->ID );
		if ( ! wp_delete_user( $user->ID, $reassign ) ) {
			return self::error( 'WordPress refused to delete the user.', 500 );
		}
		return new WP_REST_Response( array( 'ok' => true ), 200 );
	}

	/**
	 * Either a plaintext password or a bcrypt hash (Pulse account), never both.
	 *
	 * @param array<string,mixed> $body
	 * @return array{password?:string,hash?:string}|WP_Error
	 */
	private static function credential( array $body ) {
		$password = (string) ( $body['password'] ?? '' );
		$hash     = (string) ( $body['passwordHash'] ?? '' );
		if ( $hash !== '' ) {
			if ( strncmp( $hash, '$2y$', 4 ) !== 0 ) {
				return self::error( 'passwordHash must be a bcrypt hash.', 400 );
			}
			return array( 'hash' => $hash );
		}
		if ( $password !== '' ) {
			return array( 'password' => $password );
		}
		return array();
	}

	private static function write_hash( int $user_id, string $hash ): void {
		global $wpdb;
		$wpdb->update( $wpdb->users, array( 'user_pass' => $hash ), array( 'ID' => $user_id ) );
		clean_user_cache( $user_id );
	}

	private static function role_exists( string $role ): bool {
		return $role !== '' && wp_roles()->is_role( $role );
	}

	private static function is_last_administrator( WP_User $user ): bool {
		return in_array( 'administrator', (array) $user->roles, true ) && self::another_administrator_id( $user->ID ) === null;
	}

	private static function another_administrator_id( int $except ): ?int {
		$admins = get_users( array( 'role' => 'administrator', 'exclude' => array( $except ), 'number' => 1, 'fields' => 'ID' ) );
		return isset( $admins[0] ) ? (int) $admins[0] : null;
	}

	/** @return array<string,mixed> */
	private static function shape( WP_User $user ): array {
		return array(
			'id'          => (int) $user->ID,
			'login'       => (string) $user->user_login,
			'email'       => (string) $user->user_email,
			'displayName' => (string) $user->display_name,
			'roles'       => array_values( (array) $user->roles ),
			'registered'  => (string) $user->user_registered,
		);
	}

	private static function error( string $message, int $status ): WP_Error {
		return new WP_Error( 'pulse_host_users', $message, array( 'status' => $status ) );
	}
}
