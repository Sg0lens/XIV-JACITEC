jQuery(document).ready(function($) {

  'use strict';

  //SMOOTH SCROLL
  smoothScroll.init({
    speed: 500, // How fast to complete the scroll in milliseconds
    easing: 'easeInOutCubic', // Easing pattern to use
    updateURL: false, // Boolean. Whether or not to update the URL with the anchor hash on scroll
    callbackBefore: function(toggle, anchor) { }, // Function to run before scrolling
    callbackAfter: function(toggle, anchor) { } // Function to run after scrolling
  });

  //FIX HOVER EFFECT ON IOS DEVICES
  document.addEventListener("touchstart", function() { }, true);


});

$(document).ready(function() {
  $(".nav-mobile").click(function(e) {
    e.stopPropagation();

    if (window.innerWidth <= 900) {
      if ($("#nav-list").is(":visible")) {
        closeNavList();
      } else {
        openNavList();
      }
    }
  });

  $(document).click(function() {
    if (window.innerWidth <= 900 && $("#nav-list").is(":visible")) {
      closeNavList();
    }
  });

  function openNavList() {
    $(".header-inline .nav-inline").addClass("open bg-green"); // Adiciona a classe bg-green
    $(".nav-mobile").addClass("bg-green"); // Adiciona a classe bg-green
    $("#nav-icon").removeClass("fa-bars").addClass("fa-times");
    $("#nav-list").slideDown(150);
  }

  function closeNavList() {
    $(".header-inline .nav-inline").removeClass("open bg-green"); // Remove a classe bg-green
    $(".nav-mobile").removeClass("bg-green"); // Remove a classe bg-green
    $("#nav-icon").removeClass("fa-times").addClass("fa-bars");
    $("#nav-list").slideUp(150);
  }

});



$(window).load(function() {

  //HEADER ANIMATION
  $(window).scroll(function() {
    var scroll = $(window).scrollTop();
    var offset = $(".header-frame").height() / 3;

    if (scroll > offset) {
      $(".header-frame").addClass("header-frame-fixed");
    } else {
      $(".header-frame").removeClass("header-frame-fixed");
    }

  });

});

//GOOGLE MAP
function init_map() {
  var myOptions = {
    zoom: 14,
    center: new google.maps.LatLng(-22.902488, -43.175939), //change the coordinates
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    scrollwheel: false,
    styles: [{ featureType: 'all', stylers: [{ saturation: -100 }, { gamma: 0.90 }] }]
  };
  map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
  marker = new google.maps.Marker({
    map: map,
    position: new google.maps.LatLng(-22.902488, -43.175939) //change the coordinates
  });

}

function openTab(dayId) {
  const contents = document.querySelectorAll('.city');
  contents.forEach(content => {
    content.style.display = content.id === dayId ? 'block' : 'none';

  });
}

function formatTime(time) {
  let parts = time.split(":");
  return parts[0] + ":" + parts[1];
}

document.addEventListener('DOMContentLoaded', function() {
  const carousel = document.getElementById('img');

  if (!carousel) {
    console.error('Elemento com ID "img" não encontrado.');
    return;
  }

  const images = document.querySelectorAll('#img img');

  if (images.length === 0) {
    console.error('Nenhuma imagem encontrada dentro do carrossel.');
    return;
  }

  let index = 0;

  function moveToNextImage() {
    index++;
    if (index >= images.length) {
      index = 0;
    }
    const offset = -index * 100; // Ajusta a posição com base na largura das imagens
    carousel.style.transform = `translateX(${offset}vw)`;
  }

  setInterval(moveToNextImage, 4000); // Troca a cada 3 segundos
});

