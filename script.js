
(function(){
    var width = 0, height = 0, bar_h = 0, axis_h = 0, sono_h = 0;
    var canvas = null, canvas_ctx = null, axis = null, cqt = null, blocker = null, alpha_table = null;
    var audio_ctx = new window.AudioContext();
    function resume_audio_ctx() {
        if (audio_ctx.state === "suspended") {
            audio_ctx.resume();
            window.setTimeout(resume_audio_ctx, 100);
        }
    }
    resume_audio_ctx();
    var videos = document.getElementsByTagName("video");
    var video = null, stream = null;
    var img_buffer = null, audio_data_l = null, audio_data_r = null, line = null;
    var analyser_l = audio_ctx.createAnalyser();
    var analyser_r = audio_ctx.createAnalyser();
    var splitter = audio_ctx.createChannelSplitter(2);
    var panner = audio_ctx.createStereoPanner();
    var iir = audio_ctx.createBiquadFilter();
    iir.type = "peaking";
    iir.frequency.value = 10;
    iir.Q.value = 0.33;
    panner.connect(iir);
    iir.connect(splitter);
    splitter.connect(analyser_l, 0);
    splitter.connect(analyser_r, 1);
    panner.connect(audio_ctx.destination);

    var options = {};
    function load_default_options() {
        options.height = 33;
        options.bar = 17;
        options.waterfall = 33;
        options.brightness = 17;
        options.bass = -30;
        options.speed = 2;
        options.transparent = true;
        options.visible = true;
    }
    load_default_options();

    var bound = {
        height_min: 20, height_max: 100,
        bar_min: 3, bar_max: 33,
        waterfall_min: 0, waterfall_max: 40,
        brightness_min: 7, brightness_max: 49,
        bass_min: -50, bass_max: 0,
        speed_min: 1, speed_max: 3
    }

    var child_menu = {
        height: null,
        bar: null,
        waterfall: null,
        brightness: null,
        bass: null,
        speed: null,
        transparent: null,
        visible: null
    };

    function load_options(value) {
        if (value.height != undefined && value.height >= bound.height_min && value.height <= bound.height_max)
            options.height = Math.round(value.height);
        if (value.bar != undefined && value.bar >= bound.bar_min && value.bar <= bound.bar_max)
            options.bar = Math.round(value.bar);
        if (value.waterfall != undefined && value.waterfall >= bound.waterfall_min && value.waterfall <= bound.waterfall_max)
            options.waterfall = Math.round(value.waterfall);
        if (value.brightness != undefined && value.brightness >= bound.brightness_min && value.brightness <= bound.brightness_max)
            options.brightness = Math.round(value.brightness);
        if (value.bass != undefined && value.bass >= bound.bass_min && value.bass <= bound.bass_max)
            options.bass = Math.round(value.bass);
        if (value.speed != undefined && value.speed >= bound.speed_min && value.speed <= bound.speed_max)
            options.speed = Math.round(value.speed);
        if (value.transparent != undefined)
            options.transparent = value.transparent;
        if (value.visible != undefined)
            options.visible = value.visible;
    }

    function reset_child_menu() {
        child_menu.height.value = options.height;
        child_menu.bar.value = options.bar;
        child_menu.waterfall.value = options.waterfall;
        child_menu.brightness.value = options.brightness;
        child_menu.bass.value = options.bass;
        child_menu.bass.onchange();
        child_menu.speed.value = options.speed;
        child_menu.transparent.checked = options.transparent;
        child_menu.transparent.onchange();
        child_menu.visible.checked = options.visible;
        child_menu.visible.onchange();
    }

    function set_fixed_style(element, z_index) {
        element.style.position = "fixed";
        element.style.border = "none";
        element.style.margin = "0px";
        element.style.padding = "0px";
        element.style.zIndex = z_index;
    }

    function create_menu() {
        var menu = document.createElement("img");
        menu.src = chrome.extension.getURL("/icon-24.png");
        menu.width = 24;
        menu.height = 24;
        set_fixed_style(menu, 10000002);
        menu.style.left = "0px";
        menu.style.top = "0px";
        menu.style.cursor = "pointer";
        document.body.appendChild(menu);
        var menu_is_hidden = true;

        var child = null;
        var menu_table = document.createElement("div");
        set_fixed_style(menu_table, 10000001);
        menu_table.style.left = "0px";
        menu_table.style.top = "0px";
        menu_table.style.padding = "8px";
        menu_table.style.paddingTop = "32px";
        menu_table.style.border = "thin solid white";
        menu_table.style.whiteSpace = "pre";
        menu_table.style.fontFamily = "monospace";
        menu_table.style.color = "white";
        menu_table.style.fontSize = "8pt";
        menu_table.style.backgroundColor = "black";
        menu_table.style.lineHeight = "20pt";
        menu_table.style.display = "none";

        child = document.createElement("span");
        child.textContent = "Height          ";
        menu_table.appendChild(child);
        child = child_menu.height = document.createElement("input");
        child.type = "range";
        child.min  = bound.height_min;
        child.max  = bound.height_max;
        child.step = 1;
        child.value = options.height;
        child.onchange = function() {
            options.height = this.value;
        }
        menu_table.appendChild(child);
        menu_table.appendChild(document.createElement("br"));

        child = document.createElement("span");
        child.textContent = "Bar             ";
        menu_table.appendChild(child);
        child = child_menu.bar = document.createElement("input");
        child.type = "range";
        child.min  = bound.bar_min;
        child.max  = bound.bar_max;
        child.step = 1;
        child.value = options.bar;
        child.onchange = function() {
            options.bar = this.value;
        }
        menu_table.appendChild(child);
        menu_table.appendChild(document.createElement("br"));

        child = document.createElement("span");
        child.textContent = "Waterfall       ";
        menu_table.appendChild(child);
        child = child_menu.waterfall = document.createElement("input");
        child.type = "range";
        child.min  = bound.waterfall_min;
        child.max  = bound.waterfall_max;
        child.step = 1;
        child.value = options.waterfall;
        child.onchange = function() {
            options.waterfall = this.value;
        }
        menu_table.appendChild(child);
        menu_table.appendChild(document.createElement("br"));

        child = document.createElement("span");
        child.textContent = "Brightness      ";
        menu_table.appendChild(child);
        child = child_menu.brightness = document.createElement("input");
        child.type = "range";
        child.min  = bound.brightness_min;
        child.max  = bound.brightness_max;
        child.step = 1;
        child.value = options.brightness;
        child.onchange = function() {
            options.brightness = this.value;
        }
        menu_table.appendChild(child);
        menu_table.appendChild(document.createElement("br"));

        child = document.createElement("span");
        child.textContent = "Bass            ";
        menu_table.appendChild(child);
        child = child_menu.bass = document.createElement("input");
        child.type = "range";
        child.min  = bound.bass_min;
        child.max  = bound.bass_max;
        child.step = 1;
        child.value = options.bass;
        child.onchange = function() {
            options.bass = this.value;
            iir.gain.value = options.bass;
        }
        iir.gain.value = options.bass;
        menu_table.appendChild(child);
        menu_table.appendChild(document.createElement("br"));

        child = document.createElement("span");
        child.textContent = "Speed           ";
        menu_table.appendChild(child);
        child = child_menu.speed = document.createElement("input");
        child.type = "range";
        child.min = bound.speed_min;
        child.max = bound.speed_max;
        child.step = 1;
        child.value = options.speed;
        child.onchange = function() {
            options.speed = this.value;
        };
        menu_table.appendChild(child);
        menu_table.appendChild(document.createElement("br"));

        child = document.createElement("span");
        child.textContent = "Transparent      ";
        menu_table.appendChild(child);
        child = child_menu.transparent = document.createElement("input");
        child.type = "checkbox";
        child.checked = options.transparent;
        child.onchange = function() {
            options.transparent = this.checked;
            if (canvas)
                canvas.style.pointerEvents = options.transparent ? "none" : "auto";
        }
        menu_table.appendChild(child);
        menu_table.appendChild(document.createElement("br"));

        child = document.createElement("span");
        child.textContent = "Visible          ";
        menu_table.appendChild(child);
        child = child_menu.visible = document.createElement("input");
        child.type = "checkbox";
        child.checked = options.visible;
        child.onchange = function() {
            options.visible = this.checked;
            if (canvas)
                canvas.style.visibility = options.visible ? "visible" : "hidden";
            if (axis)
                axis.style.visibility = options.visible ? "visible" : "hidden";
            if (blocker)
                blocker.style.visibility = options.visible ? "visible" : "hidden";
        }
        menu_table.appendChild(child);
        menu_table.appendChild(document.createElement("br"));

        child = document.createElement("input");
        child.type = "button";
        child.style.cursor = "pointer";
        child.value = "Reset Settings";
        child.onclick = function() {
            chrome.storage.local.get(null, function(value) {
                load_default_options();
                load_options(value);
                reset_child_menu();
            });
        }
        menu_table.appendChild(child);
        menu_table.appendChild(document.createElement("br"));

        child = document.createElement("input");
        child.type = "button";
        child.style.cursor = "pointer";
        child.value = "Set as Default Settings";
        child.onclick = function() {
            var t = this;
            t.value = "Saving...";
            chrome.storage.local.set(options, function(){
                window.setTimeout(function(){ t.value = "Set as Default Settings"; }, 300);
            });
        }
        menu_table.appendChild(child);
        menu_table.appendChild(document.createElement("br"));

        child = document.createElement("input");
        child.type = "button";
        child.style.cursor = "pointer";
        child.value = "Reset Default Settings";
        child.onclick = function() {
            var t = this;
            t.value = "Resetting...";
            chrome.storage.local.clear(function(){
                window.setTimeout(function(){ t.value = "Reset Default Settings"; }, 300); 
            });
        }
        menu_table.appendChild(child);

        document.body.appendChild(menu_table);
        menu.onclick = function() {
            if (menu_is_hidden)
                menu_table.style.display = "block";
            else
                menu_table.style.display = "none";
            menu_is_hidden = !menu_is_hidden;
        }
    }

    function resize_canvas() {
        if (!canvas) {
            canvas = document.createElement("canvas");
            set_fixed_style(canvas, 9999999);
            canvas.style.bottom = "0px";
            canvas.style.left = "0px";
            document.body.appendChild(canvas);
        }
        canvas.width = width;
        canvas.height = height;
        canvas.style.visibility = options.visible ? "visible" : "hidden";
        canvas.style.pointerEvents = options.transparent ? "none" : "auto";
        canvas_ctx = canvas.getContext("2d", {alpha: true});
        img_buffer = canvas_ctx.createImageData(width, height);
        /* make opaque */
        for (var k = 0; k < width * height * 4; k += 4) {
            img_buffer.data[k] = 0;
            img_buffer.data[k+1] = 0;
            img_buffer.data[k+2] = 0;
            img_buffer.data[k+3] = 255;
        }

        if (!axis) {
            axis = document.createElement("img");
            axis.src = chrome.extension.getURL("/axis-1920x32.png");
            set_fixed_style(axis, 10000000);
            axis.style.left = "0px";
            document.body.appendChild(axis);
        }
        axis.width = width;
        axis.height = axis_h;
        axis.style.bottom = sono_h + "px";
        axis.style.visibility = options.visible ? "visible" : "hidden";

        if (!blocker) {
            blocker = document.createElement("div");
            set_fixed_style(blocker, 9999998);
            blocker.style.left = "0px";
            blocker.style.bottom = "0px";
            document.body.appendChild(blocker);
        }
        blocker.style.width = width + "px";
        blocker.style.height = Math.round(sono_h + axis_h + 0.1 * bar_h) + "px";
        blocker.style.visibility = options.visible ? "visible" : "hidden";
    }

    function resize() {
        var new_width = Math.min(Math.max(Math.floor(document.documentElement.clientWidth), 960), 1920);
        var new_height = Math.min(Math.max(Math.floor(window.innerHeight * options.height / 100), 100), 1080);
        var new_sono_h = Math.round(new_height * options.waterfall / 100);
        if (new_sono_h > 0)
            new_sono_h = Math.max(new_sono_h, 4);
        var new_axis_h = Math.round(new_width * 32 / 1920);
        var new_bar_h = new_height - new_sono_h - new_axis_h;

        if (new_width != width || new_bar_h != bar_h || new_height != height || new_axis_h != axis_h) {
            if (new_width != width)
                cqt = new ShowCQTBar(audio_ctx.sampleRate, new_width, 1, 17, 17, 1);
            width = new_width;
            bar_h = new_bar_h;
            height = new_height;
            sono_h = new_sono_h;
            axis_h = new_axis_h;
            bar_h = new_bar_h;
            audio_data_l = cqt.get_input_array(0);
            audio_data_r = cqt.get_input_array(1);
            analyser_l.fftSize = cqt.fft_size;
            analyser_r.fftSize = cqt.fft_size;
            line = cqt.get_output_array();
            resize_canvas();

            alpha_table = new Uint8Array(bar_h + axis_h);
            for (var y = 0; y < bar_h; y++)
                alpha_table[y] = Math.round(255 * Math.sin(0.5*Math.PI*y/bar_h) * Math.sin(0.5*Math.PI*y/bar_h));
            for (var y = bar_h; y < bar_h + axis_h; y++)
                alpha_table[y] = 255;
        }
    }

    function draw() {
        requestAnimationFrame(draw);
        if (videos.length > 0 && video != videos[0]) {
            if (stream)
                stream.disconnect();

            video = videos[0];
            stream = audio_ctx.createMediaElementSource(video);
            stream.connect(panner);
        }

        if (canvas || video)
            resize();

        if (!canvas || !options.visible)
            return;

        analyser_l.getFloatTimeDomainData(audio_data_l);
        analyser_r.getFloatTimeDomainData(audio_data_r);
        cqt.set_height(bar_h);
        cqt.set_volume(options.bar, options.brightness);
        cqt.calc();

        for (var y = 0; y < bar_h + axis_h; y++) {
            cqt.render_line(y, options.transparent ? alpha_table[y] : 255);
            img_buffer.data.set(line, 4*width*y);
        }

        if (sono_h) {
            var speed = Math.round(options.speed);
            img_buffer.data.copyWithin(4*width*(bar_h+axis_h), 4*width*(bar_h+axis_h-speed), 4*width*(height-speed));
            var src0 = 4*width*(bar_h+axis_h);
            var src1 = 4*width*(bar_h+axis_h+speed);
            var dst_a = 4*width*(bar_h+axis_h+1);
            var dst_b = 4*width*(bar_h+axis_h+2);

            if (speed == 2) {
                for (var x = 0; x < width*4; x++)
                    img_buffer.data[dst_a+x] = 0.3333 + 0.5 * (img_buffer.data[src0+x] + img_buffer.data[src1+x]);
            }

            if (speed == 3) {
                for (var x = 0; x < width*4; x++) {
                    img_buffer.data[dst_a+x] = 0.3333 + 0.6667 * img_buffer.data[src0+x] + 0.3333 * img_buffer.data[src1+x];
                    img_buffer.data[dst_b+x] = 0.3333 + 0.3333 * img_buffer.data[src0+x] + 0.6667 * img_buffer.data[src1+x];
                }
            }
        }
        canvas_ctx.putImageData(img_buffer, 0, 0);
    }

    chrome.storage.local.get(null, function(value) {
        load_options(value);
        create_menu();
        requestAnimationFrame(draw);
    });

})();
