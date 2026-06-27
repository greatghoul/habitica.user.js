// ==UserScript==
// @name         HabitRPG - Hide System Messages in Party
// @namespace    https://anl.gg/
// @version      0.1.2
// @description  Don't show system messages in party by default.
// @author       greatghoul
// @updateURL    https://github.com/greatghoul/habitrpg_userscripts/raw/refs/heads/main/Hide%20System%20Messages%20in%20Party/main.user.js
// @downloadURL  https://github.com/greatghoul/habitrpg_userscripts/raw/refs/heads/main/Hide%20System%20Messages%20in%20Party/main.user.js
// @match        https://habitica.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=habitica.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function getTarget () {
        const path = document.location.pathname;
        const targetNode = document.querySelector(".chat-receive-actions");

        if (path === "/party" && targetNode) {
            return targetNode;
        }
    }

    function toggleSystemMessages (show) {
        let styleTag = document.querySelector("#crx-hide-system-messages");
        if (!styleTag) {
            styleTag = document.createElement("style");
            styleTag.id = "crx-hide-system-messages";
            styleTag.type = "text/css";
            document.querySelector("head").appendChild(styleTag);
        }

        if (show) {
            styleTag.innerHTML = `
              .btn_system_message_show { display: none; }
              .btn_system_message_hide { display: inline-block; }
            `;
        } else {
            styleTag.innerHTML = `
                .message-row:has(.system-message) { display: none; }
                .btn_system_message_show { display: inline-block; }
                .btn_system_message_hide { display: none; }
            `;
        }
    }


    function render () {
        const target = getTarget();
        if (!target) return;
        if (target.querySelector(".btn_system_message")) return;

        const btnShow = document.createElement("button");
        btnShow.className = "btn btn-secondary float-left btn_system_message btn_system_message_show";
        btnShow.innerHTML = "Show System Messages";
        btnShow.addEventListener("click", () => toggleSystemMessages(true), false);
        target.appendChild(btnShow);

        const btnHide = document.createElement("button");
        btnHide.className = "btn btn-secondary float-left btn_system_message btn_system_message_hide";
        btnHide.innerHTML = "Hide System Messages";
        btnHide.addEventListener("click", () => toggleSystemMessages(false), false);
        target.appendChild(btnHide);

        toggleSystemMessages(false);
    }

    const container = document.body;
    const observer = new MutationObserver(render);
    observer.observe(container, { childList: true });
    render();
})();
