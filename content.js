let wikie_request_timer = null;
let wikie_display_timer = null;
let wikie_included = false;
let wikie_info_container = null;
let wikie_info_status = null;
let wikie_info_container_header = null;

function handleLinks() {
  if (location.href.indexOf("isthereanydeal.com") === -1) {
    const external_links = document.querySelectorAll('a[href*="wikipedia.org/"]:not([data-wikie-handled="1"])');

    for (let i = 0; i < external_links.length; i++) {

      let matches = external_links[i].href.match(/\/\/(.{2})\.wikipedia\.org\/wiki\/(.+)/);
      let page = null;

      if (matches && matches.length === 3) page = matches[2];

      if (page) {
        const elementToAppend = document.createElement('span');
        elementToAppend.dataset.wikieId = matches[1] + '/' + matches[2];
        elementToAppend.classList.add("wikie_everywhere");
        elementToAppend.textContent = "W";
        appendAfterFirstText(external_links[i], elementToAppend);

        elementToAppend.addEventListener("mouseenter", OnEnterExtraElem, {
          passive: true
        });
        elementToAppend.addEventListener("mouseleave", OnLeaveExtraElem, {
          passive: true
        });

        external_links[i].dataset.wikieHandled = "1";
      }
    }
  }

  if (wikie_included && wikie_info_container === null) {
    wikie_info_container = document.createElement('div');
    wikie_info_container.id = "wikie_info_container";
    wikie_info_container_header = document.createElement('div');
    // wikie_info_container_header.innerHTML = "<a id='wikie_info_container_header' target='_blank' rel='noopener' href='https://wikipedia.org/'>Wikipedia</a>";
    wikie_info_container.appendChild(wikie_info_container_header);
    wikie_info_status = document.createElement('div');
    wikie_info_status.id = "wikie_info_status";
    wikie_info_status.innerHTML = "Loading...";
    wikie_info_container.appendChild(wikie_info_status);
    document.body.appendChild(wikie_info_container);

    wikie_info_container.addEventListener("mouseenter", OnEnterContainer, {
      passive: true
    });
    wikie_info_container.addEventListener("mouseleave", OnLeaveContainer, {
      passive: true
    });

    // wikie_display_timer = setTimeout(function () {
    wikie_info_container.classList.add("wikie_info_container_hidden");
    // }, 2000);
  }
}

function appendAfterFirstText(parentElement, elementToAppend) {
  for (const childElement of parentElement.childNodes) {

    if ((childElement.nodeType === Node.TEXT_NODE && childElement.textContent.trim().length > 0) || childElement.nodeName === 'I') {
      parentElement.insertBefore(elementToAppend, childElement.nextSibling);
      wikie_included = true;
      return true;
    }

    if (appendAfterFirstText(childElement, elementToAppend)) {
      return true;
    }
  }
  return false;
}

function getItemInfo(e, currentInfoElemId) {
  clearTimeout(wikie_request_timer);
  wikie_request_timer = setTimeout(function () {

    let params = e.target.dataset.wikieId.split("/")

    const feedURL = "https://" + params[0] + ".wikipedia.org/api/rest_v1/page/summary/" + params[1];
    const xhr1 = new XMLHttpRequest();
    xhr1.open("GET", feedURL, true);
    xhr1.onreadystatechange = function () {
      buildItemInfo(e, currentInfoElemId);
    };
    xhr1.send();

    function buildItemInfo(a, b) {
      if (xhr1.readyState === 4 && xhr1.status === 200) {
        let result = xhr1.responseText
        result = JSON.parse(result);

        let wikie_info_thumbnail = result.thumbnail ? '<div id="wikie_info_image" > <img src="' + result.thumbnail.source + '"></div>' : ''

        let wikie_info_output = wikie_info_thumbnail + result.extract_html

        const wikie_info_elem = document.createElement("div");
        wikie_info_elem.id = b;
        wikie_info_elem.classList.add("wikie_info_elem");

        if (result.extract_html !== '') {
          wikie_info_elem.innerHTML = wikie_info_output;
        } else {
          wikie_info_elem.classList.add("noinfo");
          wikie_info_elem.innerHTML = '<div class="wikie_info_elem_info">Currently there is no summary available for this page.</div>';
        }

        if (!document.getElementById(b)) {
          // document.getElementById("wikie_info_container_header").innerText(wikie_info_elem);
          document.getElementById("wikie_info_container").appendChild(wikie_info_elem);
        }

        keepInViewPort(wikie_info_container);
        wikie_info_status.innerHTML = "";
      }
    }
  }, 350);
}

function OnEnterExtraElem(e) {
  const rect = e.target.getBoundingClientRect();
  wikie_info_container.style.left = (getCoords(e.target).left + (rect.right - rect.left) - 8) + "px";
  wikie_info_container.style.top = (getCoords(e.target).top + (rect.bottom - rect.top) - 8 - 82) + "px";

  clearTimeout(wikie_display_timer);
  wikie_info_container.classList.remove("wikie_info_container_hidden");

  const currentInfoElemId = "wikie_info_elem_" + e.target.dataset.wikieId.replace('/', '-');

  const divsToHide = document.getElementsByClassName("wikie_info_elem");
  for (let i = 0; i < divsToHide.length; i++) {
    if (divsToHide.id !== currentInfoElemId) {
      divsToHide[i].style.display = "none";
    }
  }

  const currentInfoElem = document.getElementById(currentInfoElemId);

  if (currentInfoElem) {
    wikie_info_status.innerHTML = "";
    currentInfoElem.style.display = 'flex';
  } else {
    wikie_info_status.innerHTML = "Loading...";
    getItemInfo(e, currentInfoElemId);
  }

  keepInViewPort(wikie_info_container);
}

function OnLeaveExtraElem(e) {
  if (wikie_info_container.classList.contains('wikie_info_container_hidden')) clearTimeout(wikie_request_timer);
  wikie_display_timer = setTimeout(function () {
    wikie_info_container.classList.add("wikie_info_container_hidden");
  }, 200);
}

function OnEnterContainer() {
  clearTimeout(wikie_display_timer);
  wikie_info_container.classList.remove("wikie_info_container_hidden");
}

function OnLeaveContainer() {
  wikie_display_timer = setTimeout(function () {
    wikie_info_container.classList.add("wikie_info_container_hidden");
  }, 200);
}

function keepInViewPort(elem) {
  let rect = elem.getBoundingClientRect();

  if (rect.bottom + 20 > window.innerHeight) {
    elem.style.top = (getCoords(elem).top - (rect.bottom - window.innerHeight) - 20) + "px";
  }
  if (rect.right + 20 > window.innerWidth) {
    elem.style.left = (getCoords(elem).left - (rect.right - window.innerWidth) - 20) + "px";
  }
}

function getCoords(elem) {
  let box = elem.getBoundingClientRect();

  return {
    top: box.top + pageYOffset,
    left: box.left + pageXOffset
  };
}

let observer = new MutationObserver(mutationsList => {
  for (let mutation of mutationsList) {
    if (mutation.type === 'childList') {
      handleLinks();
    }
  }
});

observer.observe(document, {
  childList: true,
  subtree: true
});
handleLinks();
