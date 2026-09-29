(function ($) {
    'use strict';

    // ── Media uploader (single) ──
    $(document).on('click', '.sh-media-btn', function (e) {
        e.preventDefault();
        var $btn = $(this);
        var $field = $btn.closest('.sh-media-field');
        var $input = $field.find('.sh-media-id');
        var $preview = $field.find('.sh-media-preview');

        var frame = wp.media({ multiple: false });
        frame.on('select', function () {
            var attachment = frame.state().get('selection').first().toJSON();
            $input.val(attachment.id);
            var url = attachment.sizes && attachment.sizes.thumbnail ? attachment.sizes.thumbnail.url : attachment.url;
            $preview.html('<img src="' + url + '">');

            // If this is a video field, clear the URL input
            var $urlInput = $field.closest('.sh-video-field').find('.sh-video-url');
            if ($urlInput.length) $urlInput.val('');
        });
        frame.open();
    });

    // Media remove
    $(document).on('click', '.sh-media-remove', function (e) {
        e.preventDefault();
        var $field = $(this).closest('.sh-media-field');
        $field.find('.sh-media-id').val('0');
        $field.find('.sh-media-preview').html('');
    });

    // ── Video URL ↔ upload sync ──
    $(document).on('input', '.sh-video-url', function () {
        var url = $(this).val().trim();
        if (url) {
            $(this).closest('.sh-video-field').find('.sh-video-input').val(url);
        }
    });

    // ── Gallery uploader (multi) ──
    $(document).on('click', '.sh-gallery-btn', function (e) {
        e.preventDefault();
        var $field = $(this).closest('.sh-gallery-field');
        var $input = $field.find('.sh-gallery-ids');
        var $preview = $field.find('.sh-gallery-preview');

        var frame = wp.media({ multiple: true });
        frame.on('select', function () {
            var ids = $input.val() ? $input.val().split(',').filter(Boolean) : [];
            frame.state().get('selection').each(function (att) {
                att = att.toJSON();
                ids.push(att.id);
                var url = att.sizes && att.sizes.thumbnail ? att.sizes.thumbnail.url : att.url;
                $preview.append(
                    '<span class="sh-gallery-thumb" data-id="' + att.id + '">' +
                    '<img src="' + url + '">' +
                    '<button type="button" class="sh-gallery-remove-img">&times;</button>' +
                    '</span>'
                );
            });
            $input.val(ids.join(','));
        });
        frame.open();
    });

    // Gallery remove single image
    $(document).on('click', '.sh-gallery-remove-img', function (e) {
        e.preventDefault();
        var $thumb = $(this).closest('.sh-gallery-thumb');
        var $field = $thumb.closest('.sh-gallery-field');
        var $input = $field.find('.sh-gallery-ids');
        var removeId = String($thumb.data('id'));
        var ids = $input.val().split(',').filter(function (id) { return id !== removeId; });
        $input.val(ids.join(','));
        $thumb.remove();
    });

    // ── Repeater ──
    $(document).on('click', '.sh-repeater-add', function (e) {
        e.preventDefault();
        var group = $(this).data('group');
        var $repeater = $('.sh-repeater[data-group="' + group + '"]');
        var $items = $repeater.find('> .sh-repeater-item');

        if (!$items.length) return;

        var $template = $items.last().clone();
        var newIndex = $items.length;

        // Clear values
        $template.find('input[type="text"], input[type="url"], input[type="email"], input[type="number"], textarea').val('');
        $template.find('input[type="hidden"]').each(function () {
            if ($(this).hasClass('sh-media-id') || $(this).hasClass('sh-gallery-ids')) {
                $(this).val($(this).hasClass('sh-media-id') ? '0' : '');
            }
        });
        $template.find('input[type="checkbox"]').prop('checked', false);
        $template.find('.sh-media-preview, .sh-gallery-preview').html('');

        // Update indices in name attributes
        $template.find('[name]').each(function () {
            var name = $(this).attr('name');
            // Replace the last numeric index before the field key
            var parts = name.match(/^(.*\[)(\d+)(\].*)$/);
            if (parts) {
                $(this).attr('name', parts[1] + newIndex + parts[3]);
            }
        });

        $repeater.append($template);
    });

    $(document).on('click', '.sh-repeater-remove', function (e) {
        e.preventDefault();
        var $item = $(this).closest('.sh-repeater-item');
        var $repeater = $item.closest('.sh-repeater');

        if ($repeater.find('> .sh-repeater-item').length <= 1) {
            alert('Cannot remove the last item.');
            return;
        }

        $item.remove();

        // Reindex
        $repeater.find('> .sh-repeater-item').each(function (idx) {
            $(this).find('[name]').each(function () {
                var name = $(this).attr('name');
                var parts = name.match(/^(.*\[)(\d+)(\].*)$/);
                if (parts) {
                    $(this).attr('name', parts[1] + idx + parts[3]);
                }
            });
        });
    });

    // ── JSON editor ──
    // Validate before form submit on JSON tab
    $('form.sh-settings-form').on('submit', function () {
        var $textarea = $('#sh-json-textarea');
        if (!$textarea.length) return true;

        try {
            JSON.parse($textarea.val());
            return true;
        } catch (e) {
            alert('Invalid JSON: ' + e.message);
            return false;
        }
    });

    // Download JSON
    $('#sh-json-download').on('click', function () {
        var json = $('#sh-json-textarea').val();
        var blob = new Blob([json], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'sh-settings.json';
        a.click();
        URL.revokeObjectURL(a.href);
    });

    // Upload JSON
    $('#sh-json-upload-btn').on('click', function () {
        $('#sh-json-upload').click();
    });
    $('#sh-json-upload').on('change', function () {
        var file = this.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var parsed = JSON.parse(e.target.result);
                $('#sh-json-textarea').val(JSON.stringify(parsed, null, 2));
            } catch (err) {
                alert('Invalid JSON file: ' + err.message);
            }
        };
        reader.readAsText(file);
    });

})(jQuery);
