// TODO: Use socket.io, which would clean this all up
var socket = new WebSocket("ws://localhost:6565/");

socket.onmessage = function(message) {
    console.log('received message ' + message);
};

$(function() {
    $('.volume').knob({
        min: -30,
        max: 6,
        width: 150,
        height: 150,
        fgColor: '#c0ffff',
        bgColor: '#222',
        skin: 'tron',
        thickness: .1,
        angleOffset: 220,
        angleArc: 270,
        release : function(v) {
            socket.send(JSON.stringify({'valueChange': {volume: v}}));
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
            console.log(newValue);
            return minColor.transition(maxColor, perc);
        }

        var curColor = interpolateColor(0).toHexString();

        $(this).knob({
            min: -20,
            max: 10,
            width: 75,
            height: 75,
            fgColor: '#ffec03',
            bgColor: '#222',
            skin: 'tron',
            thickness: .2,
            angleOffset: 220,
            angleArc: 270,
            displayInput: false,
            release: function(v) {
                socket.send(JSON.stringify({
                    'valueChange': {
                        eq: {gain: v, index: index+1}
                    }
                }));
            },
            change: function(v) {
                curColor = interpolateColor(v).toHexString();
            },
            draw: function() {
                this.o.fgColor = curColor;
                this.i.css('color', curColor);
            }
        });
    });
});
