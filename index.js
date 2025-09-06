import IMask from 'imask';
import DOMPurify from 'dompurify';
import $ from 'jquery';
import './libs/slick/slick.min.js';
import './libs/slick/slick.css';
import './libs/slick/slick-theme.css';
import './styles/styles.scss';

document.addEventListener('DOMContentLoaded', function () {
  const TELEGRAM_API_TOKEN = '8111234992:AAGtkwma-fIAYeIFLEzijZSHtokhCFPK_OA';
  const CHAT_ID_MAXIM = 5629091820;
  const CHAT_ID_IVAN = 723496419;
  const CHAT_ID_EGOR = 608778224;
  const TELEGRAM_CHAT_IDs = [CHAT_ID_EGOR, CHAT_ID_MAXIM, CHAT_ID_IVAN];

  const messageModal = $('#message-modal');
  const reviewModal = $('#review-modal');
  const mobileMenuModal = $('#mobile-menu-modal');
  const body = $('body');
  const reviewForm = $('#review-form');
  const contactsForm = $('#contacts-form');
  const mobileServices = $('.mobile-services');

  IMask(document.querySelector('#contacts-form input[name="phone"]'), {
    mask: '+{375} (00) 000-00-00',
    lazy: false,
    placeholderChar: '_',
  });

  const markAsInvalid = (field, placeholderError) => {
    field.addClass('invalid');
    field.attr('placeholder', placeholderError);
  };

  const markAsValid = (field, placeholder) => {
    field.removeClass('invalid');
    field.attr('placeholder', placeholder);
  };

  const openModal = (modalEl) => {
    modalEl.addClass('d-block');
    body.addClass('modal-open');
  };

  const closeModal = (modalEl) => {
    modalEl.removeClass('d-block');
    body.removeClass('modal-open');
  };

  $('#write-review').click(() => openModal(reviewModal));
  $('.menu-burger .icon').click(() => openModal(mobileMenuModal));

  [reviewModal, messageModal, mobileMenuModal].forEach((modal) => modal.find('.close').click(() => closeModal(modal)));

  const showSuccessModal = (msg) => {
    messageModal.find('.text').text(msg);
    openModal(messageModal);
  };

  const getReviews = (successAction) => {
    $.get('/data/reviews.json')
      .done((reviews) => successAction(reviews))
      .fail((jqXHR, textStatus, errorThrown) => console.error('Ошибка при получении отзывов:', textStatus, errorThrown));
  };

  const createReviewItemHtml = (review) => {
    const dirtyHtml = `<div class="reviews-item">
            <p class="reviews-item__author text-30">${review.author}</p>
            <p class="reviews-item__description text-18">
              <span class="text">${review.comment}</span>
              <button class="text-14 read-more" href="#">Читать далее...</button>
            </p>
            <p class="reviews-item__date">${review.date}</p>
          </div>`;

    const cleanHtml = DOMPurify.sanitize(dirtyHtml);
    return cleanHtml;
  };

  const reviewsSliderSettings = {
    slidesToShow: 4,
    slidesToScroll: 4,
    infinite: true,
    autoplay: false,
    dots: false,
    accessibility: false,
    appendArrows: $('.slider-actions'),
    appendDots: $('.slider-actions'),
    prevArrow: $('#reviews .arrow.prev'),
    nextArrow: $('#reviews .arrow.next'),
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 800,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 500,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
        },
      },
    ],
  };

  const servicesSliderSettings = {
    slidesToShow: 1,
    prevArrow: $('.services-slider-wrapper .arrow.prev'),
    nextArrow: $('.services-slider-wrapper .arrow.next'),
    arrows: true,
    infinite: true,
  };

  const reviewItemShowMoreBtnManager = (reviewItemDescHtml) => {
    const text = $(reviewItemDescHtml).find('.text');
    if (text.prop('scrollHeight') > text.outerHeight()) {
      text.addClass('line-clamp-with-read-more');
      const readMore = $(reviewItemDescHtml).find('.read-more');
      readMore.addClass('show');
      readMore.click(() => $(reviewItemDescHtml).addClass('reviews-item__description-scroll'));
    }
  };

  $('.services-slider').slick(servicesSliderSettings);

  getReviews((reviews) => {
    $('.reviews-slider').html(reviews.map(createReviewItemHtml).join('\n'));
    $('.reviews-slider').slick(reviewsSliderSettings);
    Array.from($('.reviews-item__description')).forEach(reviewItemShowMoreBtnManager);
  });

  const hideOrShowHeaderManager = (scrollTop, lastScrollTop) => {
    if (scrollTop > lastScrollTop) {
      $('header').addClass('nav-up');
    } else {
      $('header').removeClass('nav-up');
    }
  };

  let lastScrollTop = 0;

  $(window).on('scroll', () => {
    const st = $(this).scrollTop();
    hideOrShowHeaderManager(st, lastScrollTop);
    lastScrollTop = st;

    // var scrollPos = $(document).scrollTop(); // Получаем текущую позицию прокрутки

    // $('nav a').each(function () {
    //   var currLink = $(this);
    //   var refElement = $(currLink.context.hash); // Получаем элемент, на который ссылается ссылка

    //   console.log(refElement[0]?.getBoundingClientRect().top);
    //   // Проверяем, находится ли элемент в пределах видимости
    //   if (refElement[0]?.getBoundingClientRect().top <= refElement[0]?.getBoundingClientRect().top + refElement.height() > scrollPos) {
    //     $('.menu a').removeClass('active'); // Удаляем класс active у всех ссылок
    //     currLink.addClass('active'); // Добавляем класс active к текущей ссылке
    //   }
    // });
  });

  const sendTelegramMessage = (message) => {
    return Promise.all(
      TELEGRAM_CHAT_IDs.map((chat_id) => {
        return fetch(`https://api.telegram.org/bot${TELEGRAM_API_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id,
            text: message,
            parse_mode: 'HTML',
          }),
        }).catch((error) => {
          console.error('Ошибка при отправке сообщения в Telegram:', error);
        });
      })
    );
  };

  const validateField = (field, errorText, successText) => {
    if (!field.val().trim()) {
      markAsInvalid(field, errorText);
      return false;
    }
    markAsValid(field, successText);
    return true;
  };

  const validatePhoneField = (field, errorText) => {
    if ([...field.val().trim()].filter((i) => i !== '_').length !== 19) {
      markAsInvalid(field, errorText);
      return false;
    }
    markAsValid(field, '+375 (__) ___-__-__');
    return true;
  };

  reviewForm.on('submit', (event) => {
    event.preventDefault();

    const name = reviewForm.find('input[name="name"]');
    const comment = reviewForm.find('textarea');

    const isValid = validateField(name, 'Введите ваше имя', 'Имя') && validateField(comment, 'Введите ваш отзыв', 'Текст');
    if (!isValid) return;

    const message = `📩 ${getGreeting()} Вам пришёл <b>НОВЫЙ ОТЗЫВ</b>:
       <b>Имя автора:</b> ${name.val().trim()}
       <b>Текст отзыва:</b> ${comment.val().trim()}
       <b>Дата написания отзыва:</b> ${new Date().toLocaleString('ru')}`;

    sendTelegramMessage(message).then(() => {
      showSuccessModal('Спасибо! \n В ближайшее время мы вам \n перезвоним.');
      reviewForm[0].reset();
      closeModal(reviewModal);
    });
  });

  contactsForm.on('submit', (event) => {
    event.preventDefault();

    const name = contactsForm.find('input[name="name"]');
    const phone = contactsForm.find('input[name="phone"]');
    const question = contactsForm.find('textarea[name="question"]');

    const isValid = validateField(name, 'Введите ваше имя', 'Имя') && validatePhoneField(phone, 'Введите ваш номер');
    if (!isValid) return;

    const message = `📩 ${getGreeting()} Вам пришла новая заявка на <b>ОБРАТНЫЙ ЗВОНОК</b>:
       <b>Имя:</b> ${name.val().trim()}
       <b>Телефон:</b> ${phone.val().trim()}
       <b>Вопрос:</b> ${question.val().trim()}`;

    sendTelegramMessage(message).then(() => {
      showSuccessModal('Спасибо! \n В ближайшее время мы вам \n перезвоним.');
      contactsForm[0].reset();
    });
  });

  function getGreeting() {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 5 && hours < 12) {
      return 'Доброе утро!';
    } else if (hours >= 12 && hours < 18) {
      return 'Добрый день!';
    } else if (hours >= 18 && hours < 22) {
      return 'Добрый вечер!';
    } else {
      return 'Доброй ночи!';
    }
  }

  mobileServices.find('.services-image').each((_, item) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.mobile-services .active').forEach((item) => item.classList.toggle('active'));
      item.classList.add('active');
      document.querySelector(`.${item.dataset.service}-services`).classList.add('active');
    });
  });

  const getTikTok = (successAction) => {
    $.get('/data/tiktok.html')
      .done((reviews) => successAction(reviews))
      .fail((jqXHR, textStatus, errorThrown) => console.error('Ошибка при получении frame:', textStatus, errorThrown));
  };

  getTikTok((tiktok) => $('.tiktok-frame').html(tiktok));

  const getContacts = (successAction) => {
    $.get('/data/contacts.json')
      .done((reviews) => successAction(reviews))
      .fail((jqXHR, textStatus, errorThrown) => console.error('Ошибка при получении контактов:', textStatus, errorThrown));
  };

  getContacts((contacts) => {
    contacts.forEach((contact) => {
      document.querySelectorAll(`.${contact.type}`).forEach((item) => (item.attributes.href.value = contact.link));
    });
  });
});
