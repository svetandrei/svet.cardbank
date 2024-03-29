import 'babel-polyfill';
import '../src/assets/scss/styles.scss';
import {el, setChildren, setAttr, mount, unmount} from 'redom';
import IMask from 'imask';
import creditCardType from "credit-card-type";

class CardBank {
  /**
   * Constructor
   * @param body
   */
  constructor (body) {
    this.body = body;
  }

  /**
   * Show card type image by number
   * @param item
   */
  showCardTypeByNumber(item) {
    const cardType = creditCardType(parseInt(item.value.split(' ').join('')).toString())
    if (item.parentNode.querySelector('img')) {
      item.parentNode.querySelector('img').remove();
    }
    if (item && cardType.length > 0) {
      const svgFiles = [
        'alipay.svg',
        'american-express.svg',
        'code.svg',
        'code-front.svg',
        'diners-club.svg',
        'discover.svg',
        'elo.svg',
        'generic.svg',
        'hiper.svg',
        'hipercard.svg',
        'jcb.svg',
        'maestro.svg',
        'mastercard.svg',
        'mir.svg',
        'paypal.svg',
        'unionpay.svg',
        'visa.svg',
      ];

      const svgMap = new Map();
      svgFiles.forEach(svgFile => {
        const pathFile = require(`svgFolder/${svgFile}`).default
        const arPathFile = pathFile.split('/');
        svgMap.set(arPathFile[arPathFile.length - 1].substring(0, arPathFile[arPathFile.length - 1].lastIndexOf(".")),  pathFile);
      });
      const imgCardType = el('img.card-type');
      setAttr(imgCardType,{
        src: svgMap.get([cardType[0]['type']].toString())
      })
      mount(item.parentNode, imgCardType);
    }
  }

  /**
   * Install mask for fields
   * @param item
   * @returns {InputMask<{blocks: {YY: {from: string, to: number, mask: MaskedRange}, MM: {from: number, to: number, mask: MaskedRange}}, lazy: boolean, autofix: boolean, mask: string}>|*|InputMask<{lazy: boolean, placeholderChar: string, mask: string}>|InputMask<{lazy: boolean, mask: string}>}
   */
  iMask (item) {
    switch (item.id) {
      case "card":
        return IMask(item,{
          mask: '0000 0000 0000 0000',
          lazy: false,
          placeholderChar: ' '
        })
      case 'expiry':
        return IMask(item, {
          mask: 'MM/YY',
          blocks: {
            YY: {
              mask: IMask.MaskedRange,
              from: new Date().toLocaleDateString('en', {year: '2-digit'}),
              to: 99
            },
            MM: {
              mask: IMask.MaskedRange,
              from: 1,
              to: 12
            }
          },
          autofix: true,
          lazy: false,
        })
      case 'cvv':
        return IMask(item, {
          mask: '000',
          lazy: false
        });
      default:
    }
  }

  /**
   * Return valid for fields
   * @returns {*}
   */
  schema () {
    const Joi = require('joi').extend(require('@joi/date'));
    return Joi.object({
      card: Joi.string()
        .creditCard()
        .required()
        .messages({
          'string.empty': 'Поле является обязательным',
          'string.creditCard': 'Должна быть кредитная карта'
        }),
      expiry: Joi.date()
        .format('mm/yy')
        .max('now')
        .required()
        .messages({
          'date.empty': 'Поле является обязательным',
          'date.format':'Должен быть в формате mm/yy'
        }),
      cvv: Joi.string()
        .min(3)
        .max(3)
        .regex(/^\d+$/)
        .required()
        .messages({
          'string.empty': 'Поле является обязательным',
          'string.min': 'Длиной не менее и не более 3 символов'
        }),
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
          'string.email': 'Должен быть в формате email',
          'string.empty': 'Поле является обязательным',
        })
    }).options({ abortEarly: false });
  }

  /**
   * Get format values
   * @param arr
   * @returns {{}}
   */
  getObjByInputs (arr) {
    let obj = {};
    arr.forEach((item) => {
      switch (item.id) {
        case 'card':
          obj[item.id] = item.value.split(' ').join('').toString();
        break;
        case 'cvv':
          obj[item.id] = item.value.split('_').join('');
        break;
        default:
          obj[item.id] = item.value.split(' ').join('');
      }
    });
    return obj;
  }

  /**
   * Show errors for fields
   * @param errors
   * @param inputs
   */
  displayErrors (errors, inputs) {
    inputs.forEach((item) => {
      let domErr = el('div.invalid-feedback');
      if (errors !== undefined) {
        for (let errKey of errors.details) {
          if (item.id === errKey.path[0]) {
            domErr.textContent = errKey.message;
            item.classList.add('is-invalid');
            if (!item.parentNode.querySelector('div.invalid-feedback')) {
              mount(item.parentNode, domErr);
            } else {
              item.parentNode.querySelector('div.invalid-feedback').remove();
              mount(item.parentNode, domErr);
            }
            break;
          } else {
            item.classList.remove('is-invalid');
            unmount(item.parentNode, domErr);
          }
        }
      } else {
        item.classList.remove('is-invalid');
        unmount(item.parentNode, domErr);
      }
    })
  }

  /**
   * Create form card bank
   */
  createFormCard () {
    const container = el("div.container py-5", [el('div.row d-flex justify-content-center py-5')])
    const row = el("div.col-md-10 col-lg-8 col-xl-5 b-center")
    const cardForm = el("form.p-4.needs-validation", {novalidate:''});
    const numCard = el("div.row",
      el("div.col-12-md mb-3 card-number",[
        el("label.form-label", {for:"card"}, "Номер карты"),
        el("div.card-form-control", el("input.form-control", {type:"text", id:"card"}))]
      )
    )
    const rowExpiryCCV = el("div.row");
    const expireMY = el("div.col-md-3 mb-3",
    [
        el("label.form-label", {for:"expiry"}, "ММ/ГГ"),
        el("input.form-control", {type:"text", style:"width: 100px", id:"expiry"})
      ]
    )
    const ccv = el("div.col-md-9 mb-3",
    [
        el("label.form-label", {for:"ccv"}, "CVC/CVV"),
        el("input.form-control", {type:"text", style:"width: 100px", id:"cvv"})
      ]
    )
    const email = el("div.row",
      el("div.col-12-md mb-3",
        [
          el("label.form-label", {for:"email"}, "E-mail"),
          el("input.form-control", {type:"text", placeholder: "test@test.com", id:"email"})
        ]
      )
    )
    const btn = el("button.btn btn-primary btn-block","Оплатить", {disabled: true})
    setChildren(rowExpiryCCV, [expireMY, ccv]);
    setChildren(cardForm, [numCard, rowExpiryCCV, email, btn]);
    setChildren(row, [cardForm]);
    const inputsForm = cardForm.querySelectorAll("input[type='text']");
    inputsForm.forEach((item) => {
      this.iMask(item);
      item.addEventListener('keyup', (e) => {
        if (item.id === 'card') this.showCardTypeByNumber(item);
      })
      item.addEventListener('blur', (e) => {
        try {
          const valid = this.schema().validate(this.getObjByInputs(inputsForm));
          throw valid.error;
        } catch (err) {
          this.displayErrors(err, inputsForm);
          setAttr(btn, { disabled: err !== undefined})
        }
      })
    })
    setChildren(container, [row]);
    mount(this.body, container);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  let card = new CardBank(document.querySelector('body'));
  card.createFormCard();
})

export {CardBank}
