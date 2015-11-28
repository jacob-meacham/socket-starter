// TODO: Use socket.io, which would clean self all up
var socket = new WebSocket("ws://localhost:6565/");

var changeFromMessage = false;
socket.onmessage = function(message) {
    console.log('received message ' + message.data);
    var objectMessage = JSON.parse(message.data);
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

function tronDraw(self) {
    var a = self.angle(self.cv)  // Angle
        , sa = self.startAngle          // Previous start angle
        , sat = self.startAngle         // Start angle
        , ea                            // Previous end angle
        , eat = sat + a                 // End angle
        , r = true;

    self.g.lineWidth = self.lineWidth;

    self.o.cursor
        && (sat = eat - 0.3)
        && (eat = eat + 0.3);

    self.g.beginPath();
    self.g.strokeStyle = r ? self.o.fgColor : self.fgColor ;
    self.g.arc(self.xy, self.xy, self.radius - self.lineWidth, sat, eat, false);
    self.g.stroke();

    self.g.lineWidth = 2;
    self.g.beginPath();
    self.g.strokeStyle = self.o.fgColor;
    self.g.arc(self.xy, self.xy, self.radius - self.lineWidth + 1 + self.lineWidth * 2 / 3, 0, 2 * Math.PI, false);
    self.g.stroke();

    return false;
}

$(function() {
    $('.volume').knob({
        min: -22,
        max: 6,
        width: 150,
        height: 150,
        fgColor: '#c0ffff',
        bgColor: '#222',
        skin: 'tron',
        thickness: .1,
        angleOffset: 220,
        angleArc: 270,
        change: function(v) {
            if (!changeFromMessage) {
                // Only broadcast if the change didn't come from the server.
                socket.send(JSON.stringify({'valueChange': {volume: v}}));
            }
        },
        draw: function() {
            return tronDraw(this);
        },
        format: function(val) {
            if (val >= 0) {
                return val + ' dB';
            }
            return val;
        }
    });

    $('.eq').each(function(index) {
        function rgb(r, g, b) {
            return {red: r, green: g, blue: b};
        }
        var minColor = jQuery.Color(255, 0, 0);
        var maxColor = jQuery.Color(255, 236, 3);

        var min = -20;
        var max = 10;
        var range = max-min;

        function interpolateColor(newValue) {
            newValue += Math.abs(min);
            var perc = newValue / range;
            return minColor.transition(maxColor, perc);
        }

        var curColor = interpolateColor(0).toHexString();

        $(this).knob({
            min: min,
            max: max,
            width: 75,
            height: 75,
            fgColor: '#ffec03',
            bgColor: '#222',
            skin: 'tron',
            thickness: .2,
            angleOffset: 220,
            angleArc: 270,
            displayInput: false,
            change: function(v) {
                curColor = interpolateColor(v).toHexString();
                if (!changeFromMessage) {
                    // Only broadcast if the change didn't come from the server.
                    socket.send(JSON.stringify({
                        'valueChange': {
                            eq: {gain: v, index: index}
                        }
                    }));
                }
            },
            draw: function() {
                this.o.fgColor = curColor;
                this.i.css('color', curColor);
                return tronDraw(this);
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

            socket.send(JSON.stringify({
                'valueChange': {
                    effect: {active: active, index: index, effectIndex: $(this).data('index')}
                }
            }));
        });
    });
});
