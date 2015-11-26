var socket = io();

$(function() {
    $('.volume').knob({
        min: -30,
        max: 6,
        width: 150,
        fgColor: '#C0ffff',
        bgColor: '#222',
        skin: 'tron',
        thickness: .1,
        angleOffset: 220,
        angleArc: 270,
        release : function (v) {
            socket.emit('value-changed', {volume: v});
        }
    });

    $('.eq').knob({
        min: -20,
        max: 10,
        width: 75,
        fgColor: '#ffec03',
        bgColor: '#222',
        skin: 'tron',
        thickness: .2,
        angleOffset: 220,
        angleArc: 270,
        release : function (v) {
            socket.emit('value-changed', {eq: v});
        }
    });
});
