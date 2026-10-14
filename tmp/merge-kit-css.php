<?php
$d = unserialize( file_get_contents( __DIR__ . '/nd-kit-meta-serialized.txt' ) );
$d['custom_css'] .= "\n\n/* Hide nd-site-note mu-plugin footer block */\n.nd-site-note { display: none !important; }\n";
file_put_contents( __DIR__ . '/nd-kit-custom-css-merged.txt', $d['custom_css'] );
echo strlen( $d['custom_css'] );
