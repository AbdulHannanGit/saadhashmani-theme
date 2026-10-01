(function ($) {
    'use strict';
    var A = window.shAdmin || { i18n: {} };

    function esc(s) { return $('<span>').text(String(s)).html(); }
    function previewHtml(att) {
        if (att.type === 'image') {
            var url = att.sizes && att.sizes.thumbnail ? att.sizes.thumbnail.url : att.url;
            return '<img src="' + esc(url) + '" alt="">';
        }
        return '<code>' + esc(att.filename || att.url) + '</code>';
    }

    // Single media field (image, font, video)
    $(document).on('click', '.sh-media-btn', function (e) {
        e.preventDefault();
        var $field = $(this).closest('.sh-media-field');
        var type = $field.data('type');
        var frame = wp.media({ multiple: false, library: type ? { type: type } : {} });
        frame.on('select', function () {
            var att = frame.state().get('selection').first().toJSON();
            $field.find('.sh-media-id').val(att.id);
            $field.find('.sh-media-preview').html(previewHtml(att));
            $field.closest('.sh-video-field').find('.sh-video-url').val('');
        });
        frame.open();
    });

    $(document).on('click', '.sh-media-remove', function (e) {
        e.preventDefault();
        var $field = $(this).closest('.sh-media-field');
        $field.find('.sh-media-id').val($field.data('type') === 'video' ? '' : '0');
        $field.find('.sh-media-preview').empty();
    });

    // Video: an external URL replaces the attachment
    $(document).on('input', '.sh-video-url', function () {
        var $wrap = $(this).closest('.sh-video-field');
        var url = $(this).val().trim();
        $wrap.find('.sh-video-input').val(url);
        if (url) $wrap.find('.sh-media-preview').empty();
    });

    // Gallery (multiple images, stored as "id,id,id")
    $(document).on('click', '.sh-gallery-btn', function (e) {
        e.preventDefault();
        var $field = $(this).closest('.sh-gallery-field');
        var $input = $field.find('.sh-gallery-ids');
        var frame = wp.media({ multiple: true, library: { type: 'image' } });
        frame.on('select', function () {
            var ids = $input.val() ? $input.val().split(',').filter(Boolean) : [];
            frame.state().get('selection').each(function (att) {
                att = att.toJSON();
                ids.push(att.id);
                $field.find('.sh-gallery-preview').append('<span class="sh-gallery-thumb" data-id="' + att.id + '">' + previewHtml(att) + '<button type="button" class="sh-gallery-remove-img">&times;</button></span>');
            });
            $input.val(ids.join(','));
        });
        frame.open();
    });

    $(document).on('click', '.sh-gallery-remove-img', function (e) {
        e.preventDefault();
        var $thumb = $(this).closest('.sh-gallery-thumb');
        var $input = $thumb.closest('.sh-gallery-field').find('.sh-gallery-ids');
        var id = String($thumb.data('id'));
        $input.val($input.val().split(',').filter(function (x) { return x !== id; }).join(','));
        $thumb.remove();
    });

    // Repeaters. A group "receipts-testimonials_left" owns names starting
    // sh[receipts][testimonials_left][N]; only that N is renumbered, so nested
    // lists (e.g. a venture's stats) keep their own indexes.
    function groupPrefix(group) {
        return 'sh[' + group.split('-').join('][') + '][';
    }
    function reindex($repeater) {
        var prefix = groupPrefix($repeater.data('group'));
        var re = new RegExp('^' + prefix.replace(/[[\]]/g, '\\$&') + '\\d+\\]');
        $repeater.children('.sh-repeater-item').each(function (idx) {
            $(this).find('[name]').each(function () {
                this.name = this.name.replace(re, prefix + idx + ']');
            });
            $(this).find('> .sh-item-title .sh-item-num').text('#' + (idx + 1));
        });
    }

    $(document).on('click', '.sh-repeater-add', function (e) {
        e.preventDefault();
        var $repeater = $('.sh-repeater[data-group="' + $(this).data('group') + '"]');
        var $last = $repeater.children('.sh-repeater-item').last();
        if (!$last.length) return;
        var $item = $last.clone();
        $item.find('input[type=text], input[type=url], input[type=email], input[type=number], input[type=password], textarea').val('');
        $item.find('.sh-media-id').val(function () { return $(this).closest('.sh-media-field').data('type') === 'video' ? '' : '0'; });
        $item.find('.sh-gallery-ids').val('');
        $item.find('.sh-media-preview, .sh-gallery-preview').empty();
        $item.find('input[type=checkbox]').prop('checked', false);
        $item.find('select').each(function () { this.selectedIndex = 0; });
        $repeater.append($item);
        reindex($repeater);
        $item.find('input, textarea').filter(':visible').first().trigger('focus');
    });

    $(document).on('click', '.sh-repeater-remove', function (e) {
        e.preventDefault();
        var $repeater = $(this).closest('.sh-repeater');
        if ($repeater.children('.sh-repeater-item').length <= 1) { alert(A.i18n.lastItem || 'At least one item is required.'); return; }
        $(this).closest('.sh-repeater-item').remove();
        reindex($repeater);
    });

    // JSON tab
    $('form.sh-settings-form').on('submit', function () {
        var $t = $('#sh-json-textarea');
        if (!$t.length) return true;
        try { JSON.parse($t.val()); return true; } catch (err) { alert((A.i18n.invalidJson || 'Invalid JSON:') + ' ' + err.message); return false; }
    });
    $('#sh-json-download').on('click', function () {
        var blob = new Blob([$('#sh-json-textarea').val()], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'sh-settings-' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    $('#sh-json-upload-btn').on('click', function () { $('#sh-json-upload').trigger('click'); });
    $('#sh-json-upload').on('change', function () {
        var file = this.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
            try { $('#sh-json-textarea').val(JSON.stringify(JSON.parse(ev.target.result), null, 2)); }
            catch (err) { alert((A.i18n.invalidJson || 'Invalid JSON:') + ' ' + err.message); }
        };
        reader.readAsText(file);
    });

    // Demo media importer (batched so large videos do not hit PHP time limits)
    function logLine($log, text, type) {
        $log.append('<div class="sh-log-' + (type || 'info') + '">' + esc(text) + '</div>');
        $log.scrollTop($log[0].scrollHeight);
    }

    $('#sh-demo-import').on('click', function () {
        var url = $('#sh-demo-url').val().trim();
        if (!url) return;
        if (!confirm(A.i18n.confirmImport)) return;
        var $btn = $(this).prop('disabled', true), $spin = $('#sh-demo-spinner').addClass('is-active'), $log = $('#sh-demo-log').prop('hidden', false).empty();
        var counts = { ok: 0, skip: 0, fail: 0 };
        function finish() {
            logLine($log, 'Done: ' + counts.ok + ' imported, ' + counts.skip + ' already in the Media Library, ' + counts.fail + ' failed.', 'done');
            if (counts.ok || counts.skip) logLine($log, 'Reload this page to see the media in the fields.', 'done');
            $btn.prop('disabled', false); $spin.removeClass('is-active');
        }
        logLine($log, 'Fetching manifest…');
        $.ajax({ url: url, dataType: 'json', timeout: 30000, cache: false }).fail(function () {
            logLine($log, 'Could not load the manifest. Check the URL.', 'fail');
            $btn.prop('disabled', false); $spin.removeClass('is-active');
        }).done(function (m) {
            if (!m || !m.files || !m.files.length) { logLine($log, 'The manifest lists no files.', 'fail'); $btn.prop('disabled', false); $spin.removeClass('is-active'); return; }
            var files = m.files, idMap = {}, i = 0, size = 4;
            logLine($log, files.length + ' files.');
            (function next() {
                if (i >= files.length) return apply();
                var batch = files.slice(i, i + size);
                i += size;
                $.post({ url: A.ajaxUrl, timeout: 300000, data: { action: 'sh_demo_import_batch', nonce: A.nonce, base_url: m.base_url || '', files: JSON.stringify(batch) } })
                    .done(function (res) {
                        if (!res || !res.success) { counts.fail += batch.length; logLine($log, 'Batch failed: ' + (res && res.data ? res.data : 'unknown error'), 'fail'); return next(); }
                        (res.data.log || []).forEach(function (line) {
                            var t = line.indexOf('Imported') === 0 ? 'ok' : (line.indexOf('Exists') === 0 ? 'skip' : (line.indexOf('FAILED') === 0 ? 'fail' : 'info'));
                            if (counts[t] !== undefined) counts[t]++;
                            logLine($log, line, t);
                        });
                        $.extend(idMap, res.data.id_map || {});
                        next();
                    })
                    .fail(function (xhr, status) { counts.fail += batch.length; logLine($log, 'Batch request failed (' + status + ').', 'fail'); next(); });
            })();
            function apply() {
                if (!Object.keys(idMap).length) { logLine($log, 'Nothing to link; settings unchanged.', 'fail'); return finish(); }
                $.post({ url: A.ajaxUrl, timeout: 60000, data: { action: 'sh_demo_apply_map', nonce: A.nonce, settings_map: JSON.stringify(m.settings_map || {}), id_map: JSON.stringify(idMap) } })
                    .done(function (res) { logLine($log, res && res.success ? 'Linked ' + res.data.applied + ' media fields.' : 'Could not update settings.', res && res.success ? 'ok' : 'fail'); finish(); })
                    .fail(function () { logLine($log, 'Settings update request failed.', 'fail'); finish(); });
            }
        });
    });
})(jQuery);
