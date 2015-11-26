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
        fgColor: '#C0ffff',
        bgColor: '#222',
        skin: 'tron',
        thickness: .1,
        angleOffset: 220,
        angleArc: 270,
        release : function (v) {
            socket.send(JSON.stringify({'value': {volume: v}}));
        }
    });

    $('.eq').each(function(index) {
        $(this).knob({
            min: -20,
            max: 10,
            width: 75,
            fgColor: '#ffec03',
            bgColor: '#222',
            skin: 'tron',
            thickness: .2,
            angleOffset: 220,
            angleArc: 270,
            release: function (v) {
                var eq = 'eq' + (index + 1);
                var msg = { 'value': {}};
                msg.value[eq] = v;
                socket.send(JSON.stringify(msg));
            }
        });
    });
});
