// TODO: Use socket.io, which would clean self all up
// TODO: Obv use React or Angular instead of bare jquery. Already difficulty to use, even for a demo...
var socket = new WebSocket("ws://localhost:6565/");

var changeFromMessage = false;
var isRecording = false;
var isPlayingBack = false;
var currentRecording = [];
var recordingInitialState = {};
var lastMessageTime = 0.0;

function setState(state) {
    $('.volume').val(state.volume).trigger('change');
    ensureVolumeSize(state.volume);

    $('.eq').each(function(index) {
        $(this).val(state['eq' + index]).trigger('change');
    });

    $('.effect').removeClass('active');
    for (var i = 0; i < state.activeEffects.length; i++) {
        $('.effect').eq(state.activeEffects[i]).addClass('active');
    }
}

function resetState() {
    setState({
        volume: 0,
        eq0: 0,
        eq1: 0,
        eq2: 0,
        eq3: 0,
        eq4: 0,
        activeEffects: []
    });
}

function getState() {
    var state = {};
    state.volume = $('.volume').val();
    $('.eq').each(function(index) {
        state['eq' + index] = $(this).val();
    });

    state.activeEffects = [];
    $('.effect').each(function(index) {
        if ($(this).hasClass('active')) {
            state.activeEffects.push(index);
        }
    });

    return state;
}

function processMessage(message) {
    if (isRecording) {
        processRecording(message);
        return;
    }

    if (!changeFromMessage) {
        // Only broadcast if the change didn't come from the server.
        socket.send(JSON.stringify(message));
    }
}

function processRecording(message) {
    var timeDelta = Date.now() - lastMessageTime;
    currentRecording.push({
        'delta': timeDelta,
        'message': message
    });

    lastMessageTime = Date.now();
}

function startRecording() {
    if (isRecording || isPlayingBack) {
        return;
    }
    lastMessageTime = Date.now();
    currentRecording = [];
    recordingInitialState = getState();
    isRecording = true;

    $('.recording').click(stopRecording);
    $('.recording').text('Stop Recording');
    $('.playback').addClass('disabled');
}

function stopRecording() {
    if (!isRecording) {
        return;
    }

    isRecording = false;
    var now = Date.now();
    localStorage.setItem('curator-recording', JSON.stringify({
        initialState: recordingInitialState,
        recording: currentRecording
    }));

    $('.recording').click(startRecording);
    $('.recording').text('Start Recording');
    $('.playback').removeClass('disabled');
}

function startPlayback() {
    if (isRecording || isPlayingBack) {
        return;
    }

    $('.playback').click(stopPlayback);
    $('.playback').text('Stop Playback');
    $('.recording').addClass('disabled');

    isPlayingBack = true;
    recordingRec = JSON.parse(localStorage.getItem('curator-recording'));
    currentRecording = recordingRec.recording;
    setState(recordingRec.initialState);
    var currentMessage = 0;

    function startTimer(delay) {
        setTimeout(nextMessage, delay);
    }

    function nextMessage() {
        if (currentMessage >= currentRecording.length) {
            stopPlayback();
            return;
        }

        var rec = currentRecording[currentMessage++];

        // Send the message abroad and also reflect it locally.
        socket.send(JSON.stringify(rec.message));
        socket.onmessage(rec.message);

        startTimer(rec.delta)
    }

    nextMessage();
}

function stopPlayback() {
    if (!isPlayingBack) {
        return;
    }

    isPlayingBack = false;
    $('.playback').click(startPlayback);
    $('.playback').text('Start Playback');
    $('.recording').removeClass('disabled');
}

socket.onmessage = function(message) {
    var objectMessage;
    if (!message.data) {
        objectMessage = message;
    } else {
        console.log('received message ' + message.data);
        objectMessage = JSON.parse(message.data);
    }

    if (!objectMessage) {
        return;
    }

    if (objectMessage.clientConnections) {
        var numConnections = objectMessage.clientConnections-1; // Remove ourselves
        var text = numConnections + ' clients connected';
        if (numConnections > 0) {
            text += ' (active)';
            $('.clients').css('color', '#c0ffff');
        } else {
            text += ' (not active)';
            $('.clients').css('color', '#ffec03');
        }

        $('.clients').text(text);
    } else if (objectMessage.valueChange) {
        changeFromMessage = true;
        var valueChange = objectMessage.valueChange;
        if (valueChange.volume) {
            $('.volume').val(valueChange.volume).trigger('change');
            ensureVolumeSize(valueChange.volume);
        } else if (valueChange.eq) {
            var eq = valueChange.eq;
            var index = eq.index;
            $('.eq').eq(index).val(eq.gain).trigger('change');
        } else if (valueChange.effect) {
            function getIndexFromEffect(effectIndex) {
                var matchedEffect = $('.effect').filter(function(effect) {
                    return $(this).data('index') == effectIndex;
                });

                return $('.effect').index(matchedEffect);
            }

            var active = valueChange.effect.active;
            var index = valueChange.effect.index;
            if (!index) {
                index = getIndexFromEffect(valueChange.effect.effectIndex);
            }

            if (active) {
                $('.effect').eq(index).addClass('active');
            } else {
                $('.effect').eq(index).removeClass('active');
            }
        }
        changeFromMessage = false;
    }
};

function tronDraw(self, drawColorBars, drawBarsWithFgColor) {
    var colors = [
        '#26e000','#2fe300','#37e700','#45ea00','#51ef00',
        '#61f800','#6bfb00','#77ff02','#80ff05','#8cff09',
        '#93ff0b','#9eff09','#a9ff07','#c2ff03','#d7ff07',
        '#f2ff0a','#fff30a','#ffdc09','#ffce0a','#ffc30a',
        '#ffb509','#ffa808','#ff9908','#ff8607','#ff7005',
        '#ff5f04','#ff4f03','#f83a00','#ee2b00','#e52000'
    ];

    var numColors = colors.length;

    var a = self.angle(self.cv)
        , sa = self.startAngle
        , sat = self.startAngle
        , ea
        , eat = sat + a
        , r = true;

    self.g.lineWidth = self.lineWidth;

    self.o.cursor
        && (sat = eat - 0.3)
        && (eat = eat + 0.3);

    self.g.beginPath();
    self.g.strokeStyle = r ? self.o.fgColor : self.fgColor;
    self.g.arc(self.xy, self.xy, self.radius - self.lineWidth - 8, sat, eat, false);
    self.g.stroke();

    self.g.lineWidth = 2;
    self.g.beginPath();
    self.g.strokeStyle = self.o.fgColor;
    self.g.arc(self.xy, self.xy, self.radius - self.lineWidth - 8 + 1 + self.lineWidth * 2 / 3, 0, 2 * Math.PI, false);
    self.g.stroke();

    if (drawColorBars) {
        var angle = (self.endAngle - self.startAngle) / numColors;

        for (var i = 0; i < numColors; i++) {
            var start = sat + angle*i;
            if (start > eat) {
                break;
            }

            var color = colors[i];
            if (drawBarsWithFgColor) {
                color = self.o.fgColor;
            }
            self.g.lineWidth = 15;
            self.g.beginPath();
            self.g.strokeStyle = color;
            self.g.arc(self.xy, self.xy, self.radius, start, start + angle - 0.05, false);
            self.g.stroke();
        }
    }


    // TODO: Add colored bands around the outside.

    return false;
}

function ensureVolumeSize(v) {
    if (v <= -9) {
        $('.volume').css('font-size', '25px');
    } else {
        $('.volume').css('font-size', '30px');
    }
}

$(function() {
    $('.recording').click(startRecording);
    $('.playback').click(startPlayback);

    if (!localStorage.getItem('curator-recording')) {
        $('.playback').addClass('disabled');
    }

    $('.volume').knob({
        min: -22,
        max: 6,
        width: 160,
        height: 160,
        fgColor: '#c0ffff',
        bgColor: '#222',
        skin: 'tron',
        thickness: .1,
        angleOffset: 220,
        angleArc: 270,
        change: function(v) {
            processMessage({'valueChange': {volume: v}});

            // Size things correctly:
            ensureVolumeSize(v);
        },
        draw: function() {
            return tronDraw(this, true, true);
        },
        format: function(val) {
            return val + ' dB';
        }
    });

    ensureVolumeSize(0);

    $('.eq').each(function(index) {
        var min = -20;
        var max = 10;

        $(this).knob({
            min: min,
            max: max,
            width: 85,
            height: 85,
            fgColor: '#ffdc09',
            bgColor: '#222',
            skin: 'tron',
            thickness: .2,
            angleOffset: 220,
            angleArc: 270,
            displayInput: false,
            change: function(v) {
                processMessage({
                    'valueChange': {
                        eq: {gain: v, index: index}
                    }
                });
            },
            draw: function() {
                return tronDraw(this, true, false);
            }
        });
    });

    $('.effect').each(function(index) {
        var active = false;

        $(this).click(function() {
            active = !active;
            if (active) {
                $(this).addClass('active');
            } else {
                $(this).removeClass('active');
            }

            processMessage({'valueChange': {
                effect: {active: active, index: index, effectIndex: $(this).data('index')}
            }});
        });
    });
});

// Script mode
