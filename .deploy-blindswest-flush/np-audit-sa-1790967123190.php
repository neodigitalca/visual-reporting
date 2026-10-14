<?php
if ( ( $_GET['key'] ?? '' ) !== 'b443b6c23a25faa4004fc7ef72ede9cf' ) { http_response_code(403); exit('forbidden'); }
header('Content-Type: application/json; charset=utf-8');
$dir = __DIR__;
$wp_load = '';
for ( $i = 0; $i < 8; $i++ ) {
  if ( is_readable( $dir . '/wp-load.php' ) ) { $wp_load = $dir . '/wp-load.php'; break; }
  $dir = dirname( $dir );
}
if ( $wp_load === '' ) { http_response_code(500); echo '{"error":"wp-load missing"}'; exit; }
require_once $wp_load;

$q = new WP_Query([
  'post_type' => 'service-area',
  'post_status' => ['publish','future','draft','pending','private'],
  'posts_per_page' => -1,
  'orderby' => 'date',
  'order' => 'DESC',
]);
$rows = [];
while ($q->have_posts()) {
  $q->the_post();
  $id = get_the_ID();
  $rows[] = [
    'id' => (int) $id,
    'status' => get_post_status($id),
    'date' => get_post_field('post_date', $id),
    'slug' => get_post_field('post_name', $id),
  ];
}
wp_reset_postdata();
$byMonth = [];
foreach ($rows as $r) {
  $m = substr($r['date'], 0, 7);
  $byMonth[$m] = ($byMonth[$m] ?? 0) + 1;
}
echo wp_json_encode([
  'total' => count($rows),
  'byStatus' => array_count_values(array_column($rows, 'status')),
  'byMonth' => $byMonth,
  'future' => array_values(array_filter($rows, fn($r) => $r['status'] === 'future')),
  'draft' => array_values(array_filter($rows, fn($r) => $r['status'] === 'draft')),
], JSON_UNESCAPED_SLASHES);

@unlink( __FILE__ );
