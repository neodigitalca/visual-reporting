<?php
/**
 * Register competitor comparison CPT when not already registered (e.g. by ACF).
 *
 * @package Neo_Pulse_Wp
 */

defined( 'ABSPATH' ) || exit;

class Neo_Pulse_Wp_Competitor_Post_Type {

	public static function init(): void {
		add_action( 'init', array( __CLASS__, 'register' ), 21 );
	}

	public static function register(): void {
		if ( post_type_exists( 'competitor' ) ) {
			return;
		}

		register_post_type(
			'competitor',
			array(
				'labels'              => array(
					'name'          => __( 'Competitor comparisons', 'neo-pulse-wp' ),
					'singular_name' => __( 'Competitor comparison', 'neo-pulse-wp' ),
				),
				'public'              => true,
				'publicly_queryable'  => true,
				'show_ui'             => true,
				'show_in_rest'        => true,
				'rest_base'           => 'competitor',
				'has_archive'         => false,
				'rewrite'             => array(
					'slug'       => 'competitor',
					'with_front' => false,
				),
				'capability_type'     => 'post',
				'map_meta_cap'        => true,
				'supports'            => array( 'title', 'editor', 'excerpt', 'thumbnail', 'custom-fields' ),
				'menu_icon'           => 'dashicons-businessperson',
			)
		);
	}
}
