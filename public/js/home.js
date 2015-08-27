/**
 * Home
 */

$(document).ready(function () {
    clientTime = new Date().getTime();
    clientId = "global:" + clientTime;
    client = new Paho.MQTT.Client("wss://192.168.0.74:8443/mqtt", clientId);
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    client.connect({
        onSuccess : onConnect,
        userName: "test",
        password: "1234",
        keepAliveInterval: 120
    });
});
function onConnect() {
    topic = "iot/global";
    client.subscribe(topic);
    console.log("Subscibed Topic: " + topic);
}
// called when the client loses its connection
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost: " + responseObject.errorMessage);
    }
}

// called when a message arrives
function onMessageArrived(message) {
    if (message.payloadString) {
        console.log(new Date().getTime() + " - " + message.payloadString);
        if (message.payloadString) {
            console.log(new Date().getTime() + " - " + message.payloadString);
            $("#messages").html(message.payloadString.split("=")[1]);
        }
    }
}
