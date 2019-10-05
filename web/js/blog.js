(function Blog(){
	"use strict";

	var offlineIcon;
	// detecte the users connectivity
	var isOnline = ("onLine" in navigator) ? navigator.onLine : true;
	var isLoggedIn = /isLoggedIn=1/.test(document.cookie.toString() || "");
	//to detecte if we are using serviceWorker
	var usingSW = ("serviceWorker" in navigator);
	var swRegistration;
	var svcworker;


	document.addEventListener("DOMContentLoaded",ready,false);

	initServiceWorker().catch(console.error);

	// **********************************

	function ready() {
		offlineIcon = document.getElementById("connectivity-status");

		if (!isOnline){
			offlineIcon.classList.remove("hidden");
		}

		window.addEventListener("online",function online(){
			offlineIcon.classList.add("hidden");
			isOnline = true;
		});

		window.addEventListener("offline",function offline(){
			offlineIcon.classList.remove("hidden");
			isOnline = false;
			sendStatusUpdate();
		});
	}

	async function initServiceWorker(){
		// assign registration
		swRegistration = await navigator.serviceWorker.register("/sw.js",{
			updateViaCache: "none"
		});

		//communicate with the service workers
		// 3 stages of the service worker
		svcworker = swRegistration.installing || swRegistration.waiting || swRegistration.active;
		sendStatusUpdate(svcworker);
		// listen to the event
		// a new service worker has taken controll of the page
		navigator.serviceWorker.addEventListener("controllerchange", function onController(){
			//if that append, we have a new service worker
			svcworker = navigator.serviceWorker.controller;
			sendStatusUpdate(svcworker);
		});

		navigator.serviceWorker.addEventListener("message",onSWMessage);
	}

	function onSWMessage(evt){
		// destruct the event object that is coming in
		var { data } = evt;
		// send from the sw to the page and ask update about the page
		if (data.requestStatusUpdate){
			console.log("Received status update request from service");
			sendStatusUpdate(evt.ports && evt.ports[0]);

		}
	}

	function sendStatusUpdate(target){
		sendSWMessage ({ statusUpdate: { isOnline, isLoggedIn }}, target);
	}

	// send a message to our service worker from the page
	function sendSWMessage(msg,target){
		if (target){
			target.postMessage(msg);
		}
		else if (svcworker){
			svcworker.postMessage(msg);
		}
		else{
			navigator.serviceWorker.controller.postMessage(msg);
		}
	}

})();
