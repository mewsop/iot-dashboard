/**
 * Dashboard
 */

function WebSocketTest() {
    if ("WebSocket" in window) {
        alert("WebSocket is supported by your Browser!");
        // Let us open a web socket
        var ws = new WebSocket("wss://192.168.0.74:8443");
        console.log(ws);
        ws.onopen = function(evt) {
            alert("WebSocket Connected...");
        };

        ws.onmessage = function(evt) {
            alert("Message is received...");
        };

        ws.onclose = function(evt) {
            // websocket is closed.
            alert("Connection is closed...");
        };
    }

    else {
        // The browser doesn't support WebSocket
        alert("WebSocket NOT supported by your Browser!");
    }
}
//WebSocketTest();

$(document).ready(function () {
    $('#new-thing-dialog').on('hidden.bs.modal', function (e) {
        document.NewThing.reset();
        $(".alert.alert-danger").html("");
        $(".alert.alert-danger").css("display", "none");
    });
    $("#submit-new-thing").click(function () {
        data = $(document.NewThing).serialize();
        $.ajax({
            type: "POST",
            async: false,
            url: "thing/create",
            data: data,
            dataType: "json",
            success: function (data) {
                if (data.errors) {
                    $(".alert.alert-danger").html("");
                    $(".alert.alert-danger").css("display", "block");
                    for (key in data.errors) {
                        $(".alert.alert-danger").append(data.errors[key].message + "<br/>");
                    }
                } else {
                    $(".alert.alert-danger").html("");
                    $(".alert.alert-danger").css("display", "none");
                    location.reload();
                }
            },
            error: function (xhr,status,error) {
                console.log(xhr.responseJSON);
            }
        });
    });
    var set = false;
    $("input[thing-type=switch]").each(function () {
            bindSwitch(this);
    });
});
var clientList = [];
var connOptions = null;
var hasConnection = [];
function bindSwitch (obj) {
    var thingId = $(obj).attr("id");
    userId = $(obj).attr("user-id");
    clientTime = new Date().getTime();
    clientId = "t:" + userId + ":" + thingId + ":" + clientTime
    console.log("location.hostname: " + location.hostname);
    clientList[thingId] = new Paho.MQTT.Client(location.hostname, Number(location.port), clientId);
    // set callback handlers
    clientList[thingId].onConnectionLost = onConnectionLost;
    clientList[thingId].onMessageArrived = onMessageArrived;
    hasConnection[thingId] = false;
    var connOptions = {
            useSSL: true,
            onSuccess : function () {onConnect(thingId)},
            userName: "testuser",
            password: "23331067a6699247d017e4adf6fab8c8d2bb0508",
            keepAliveInterval: 120,
            cleanSession: true
        };
    clientList[thingId].connect(connOptions);
    $(obj).bind({
        click: function () {
            sendMqtt($(this).attr("id"));
        }
    });
}

function onConnect(thingId) {
    sendMqtt(thingId);
}
// called when the client loses its connection
function onConnectionLost(responseObject) {
    id = this.clientId.split(":")[2];
    console.log("Thing [" + id + "] connection fail, try to connect next 10 seconds");
    setTimeout(hostReachable(id), 10000);
}

// called when a message arrives
function onMessageArrived(message) {
    thingId = message.destinationName.split("/")[1];
    checked = false;
    if (message.payloadString == "ON") {
        checked = true;
    }
    if (checked) {
        $("#thing-icon-" + thingId).addClass("light-on");
    } else {
        $("#thing-icon-" + thingId).removeClass("light-on");
    }
    $("#" + thingId).prop('checked', checked);
    console.log(new Date().getTime() + " " + message.payloadString);
}

function sendMqtt(thingId) {
    status = "OFF";
    if ($("#" + thingId).is(":checked")) status = "ON"
    message = new Paho.MQTT.Message(status);
    topic = "iot/" + thingId;
    clientList[thingId].subscribe(topic);
    console.log("Subscriped Topic : " + topic);
    console.log(topic);
    message.destinationName = topic;
    clientList[thingId].send(message);
}
function sendHttpMqtt(topic) {
    status = "OFF";
    if ($("#" + topic.split("/")[1]).is(":checked")) status = "ON"
    message = status;
    _csrf = document.NewThing._csrf.value;
    $.ajax({
        type: "POST",
        async: false,
        url: "mqtt/publish",
        data: {topic: topic, message: message, _csrf: _csrf},
        dataType: "json",
        success: function (data) {
            console.log(data);
        },
        error: function (xhr,status,error) {
            console.log(xhr.responseJSON);
        }
    });
}
function hostReachable(thingId) {
	if (!hasConnection[thingId]) {
	  // Handle IE and more capable browsers
	  var xhr = new ( window.ActiveXObject || XMLHttpRequest )( "Microsoft.XMLHTTP" );

	  // Open new request as a HEAD to the root hostname with a random param to bust the cache
	  xhr.open( "HEAD", "//" + window.location.hostname + ":8443/?rand=" + Math.floor((1 + Math.random()) * 0x10000), false );

	  // Issue request and handle response
	  try {
	    xhr.send();
	    hasConnection[thingId] = true;
	  } catch (error) {
		console.log("Connection fail!");
		hasConnection[thingId] = false;
	  }
	  setTimeout(hostReachable(thingId), 10000);
	} else {
		console.log("Try to connect thingId: " + thingId);
		hasConnection[thingId] = false;
		connOptions = {
	            useSSL: true,
	            onSuccess : function () {onConnect(thingId)},
	            userName: "testuser",
	            password: "23331067a6699247d017e4adf6fab8c8d2bb0508",
	            keepAliveInterval: 120,
	            cleanSession: true
	        };
		clientList[thingId].connect(connOptions);
	}
}