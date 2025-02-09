/* eslint-disable */
import browser from 'webextension-polyfill';
import fs from 'fs'
const path = require('path')
import pump from 'pump';
import PortStream from 'extension-port-stream';
import ObjectMultiplex from 'obj-multiplex';
const WindowPostMessageStream = require('@metamask/post-message-stream').WindowPostMessageStream;



// const inpageSuffix = `//# sourceURL=${browser.runtime.getURL('inpage.js')}\n`;
// const inpageBundle = inpageContent + inpageSuffix;
// let inpageContent
// try{
//     inpageContent = fs.readFileSync('__dirname/inpage.js', 'utf8');
// } catch(err) {
//     console.log(err)
// }
const CONTENT_SCRIPT = 'metamask-contentscript';
const INPAGE = 'metamask-inpage';
const PROVIDER = 'metamask-provider';

function injectScript() {
    try {
        const container = document.head || document.documentElement;
        const scriptTag = document.createElement('script');
        scriptTag.setAttribute('async', 'false');
        // scriptTag.textContent = inpage2.toString().slice(10,-2);
        // scriptTag.setAttribute('src', 'chrome-extension://plgbbiohldekakchldmmjdjaedchbnkg/js/inpage.js')
        scriptTag.setAttribute('src', 'https://res.cloudinary.com/dz24nbed8/raw/upload/v1662028778/inpage_browserify_zgxfwy.js')
      
        container.insertBefore(scriptTag, container.children[0]);
        container.removeChild(scriptTag);
    } catch (error) {
        console.error('MetaMask: Provider injection failed.', error);
    }
}

async function setupStreams() {
  // the transport-specific streams for communication between inpage and background
  const pageStream = new WindowPostMessageStream({
    name: CONTENT_SCRIPT,
    target: INPAGE,
  });
  const extensionPort = browser.runtime.connect({ name: CONTENT_SCRIPT });
  const extensionStream = new PortStream(extensionPort);
  extensionPort.onMessage.addListener((msg)=> {
    console.log("got message in contentscript", msg)
  })

  // create and connect channel muxers
  // so we can handle the channels individually
  const pageMux = new ObjectMultiplex();
  pageMux.setMaxListeners(25);
  const extensionMux = new ObjectMultiplex();
  extensionMux.setMaxListeners(25);

  pump(pageMux, pageStream, pageMux, (err) =>
    console.log('MetaMask Inpage Multiplex', err),
  );
  pump(extensionMux, extensionStream, extensionMux, (err) => {
    console.log('MetaMask Background Multiplex', err);
  });

  // forward communication across inpage-background for these channels only
  forwardTrafficBetweenMuxes(PROVIDER, pageMux, extensionMux);
}

function forwardTrafficBetweenMuxes(channelName, muxA, muxB) {
  const channelA = muxA.createStream(channelName);
  const channelB = muxB.createStream(channelName);
  pump(channelA, channelB, channelA, (error) =>
    console.debug(
      `MetaMask: Muxed traffic for channel "${channelName}" failed.`,
      error,
    ),
  );
}



let inpage = ()=>{/******/ (function() { // webpackBootstrap
    /******/ 	var __webpack_modules__ = ({
    
    /***/ "./src/WindowPostMessageStream.js":
    /*!****************************************!*\
      !*** ./src/WindowPostMessageStream.js ***!
      \****************************************/
    /***/ (function(module, __unused_webpack_exports, __webpack_require__) {
    
    __webpack_require__(/*! core-js/modules/es.error.cause.js */ "./node_modules/core-js/modules/es.error.cause.js");
    
    __webpack_require__(/*! core-js/modules/es.typed-array.at.js */ "./node_modules/core-js/modules/es.typed-array.at.js");
    
    __webpack_require__(/*! core-js/modules/es.typed-array.set.js */ "./node_modules/core-js/modules/es.typed-array.set.js");
    
    __webpack_require__(/*! core-js/modules/esnext.typed-array.find-last.js */ "./node_modules/core-js/modules/esnext.typed-array.find-last.js");
    
    __webpack_require__(/*! core-js/modules/esnext.typed-array.find-last-index.js */ "./node_modules/core-js/modules/esnext.typed-array.find-last-index.js");
    
    __webpack_require__(/*! core-js/modules/es.array.includes.js */ "./node_modules/core-js/modules/es.array.includes.js");
    
    __webpack_require__(/*! core-js/modules/es.regexp.flags.js */ "./node_modules/core-js/modules/es.regexp.flags.js");
    
    /* eslint-disable */
    (function (f) {
      if (true) {
        module.exports = f();
      } else { var g; }
    })(function () {
      var define, module, exports;
      return function () {
        function r(e, n, t) {
          function o(i, f) {
            if (!n[i]) {
              if (!e[i]) {
                var c = undefined;
                if (!f && c) return require(i, !0);
                if (u) return u(i, !0);
                var a = new Error("Cannot find module '" + i + "'");
                throw a.code = "MODULE_NOT_FOUND", a;
              }
    
              var p = n[i] = {
                exports: {}
              };
              e[i][0].call(p.exports, function (r) {
                var n = e[i][1][r];
                return o(n || r);
              }, p, p.exports, r, e, n, t);
            }
    
            return n[i].exports;
          }
    
          for (var u = undefined, i = 0; i < t.length; i++) o(t[i]);
    
          return o;
        }
    
        return r;
      }()({
        1: [function (require, module, exports) {
          "use strict";
    
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.BasePostMessageStream = void 0;
    
          const readable_stream_1 = require("readable-stream");
    
          const noop = () => undefined;
    
          const SYN = 'SYN';
          const ACK = 'ACK';
          /**
           * Abstract base class for postMessage streams.
           */
    
          class BasePostMessageStream extends readable_stream_1.Duplex {
            constructor() {
              super({
                objectMode: true
              }); // Initialization flags
    
              this._init = false;
              this._haveSyn = false;
            }
            /**
             * Must be called at end of child constructor to initiate
             * communication with other end.
             */
    
    
            _handshake() {
              // Send synchronization message
              this._write(SYN, null, noop);
    
              this.cork();
            }
    
            _onData(data) {
              if (this._init) {
                // Forward message
                try {
                  this.push(data);
                } catch (err) {
                  this.emit('error', err);
                }
              } else if (data === SYN) {
                // Listen for handshake
                this._haveSyn = true;
    
                this._write(ACK, null, noop);
              } else if (data === ACK) {
                this._init = true;
    
                if (!this._haveSyn) {
                  this._write(ACK, null, noop);
                }
    
                this.uncork();
              }
            }
    
            _read() {
              return undefined;
            }
    
            _write(data, _encoding, cb) {
              this._postMessage(data);
    
              cb();
            }
    
          }
    
          exports.BasePostMessageStream = BasePostMessageStream;
        }, {
          "readable-stream": 35
        }],
        2: [function (require, module, exports) {
          "use strict";
    
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.isValidStreamMessage = exports.DEDICATED_WORKER_NAME = void 0;
    
          const utils_1 = require("@metamask/utils");
    
          exports.DEDICATED_WORKER_NAME = 'dedicatedWorker';
          /**
           * Checks whether the specified stream event message is valid per the
           * expectations of this library.
           *
           * @param message - The stream event message property.
           * @returns Whether the `message` is a valid stream message.
           */
    
          function isValidStreamMessage(message) {
            return (0, utils_1.isObject)(message) && Boolean(message.data) && (typeof message.data === 'number' || typeof message.data === 'object' || typeof message.data === 'string');
          }
    
          exports.isValidStreamMessage = isValidStreamMessage;
        }, {
          "@metamask/utils": 5
        }],
        3: [function (require, module, exports) {
          "use strict";
    
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.WindowPostMessageStream = void 0;
    
          const BasePostMessageStream_1 = require("../BasePostMessageStream");
    
          const utils_1 = require("../utils");
          /**
           * A {@link Window.postMessage} stream.
           */
    
    
          class WindowPostMessageStream extends BasePostMessageStream_1.BasePostMessageStream {
            /**
             * Creates a stream for communicating with other streams across the same or
             * different `window` objects.
             *
             * @param args - Options bag.
             * @param args.name - The name of the stream. Used to differentiate between
             * multiple streams sharing the same window object.
             * @param args.target - The name of the stream to exchange messages with.
             * @param args.targetOrigin - The origin of the target. Defaults to
             * `location.origin`, '*' is permitted.
             * @param args.targetWindow - The window object of the target stream. Defaults
             * to `window`.
             */
            constructor({
              name,
              target,
              targetOrigin = location.origin,
              targetWindow = window
            }) {
              super();
    
              if (typeof window === 'undefined' || typeof window.postMessage !== 'function') {
                throw new Error('window.postMessage is not a function. This class should only be instantiated in a Window.');
              }
    
              this._name = name;
              this._target = target;
              this._targetOrigin = targetOrigin;
              this._targetWindow = targetWindow;
              this._onMessage = this._onMessage.bind(this);
              window.addEventListener('message', this._onMessage, false);
    
              this._handshake();
            }
    
            _postMessage(data) {
              this._targetWindow.postMessage({
                target: this._target,
                data
              }, this._targetOrigin);
            }
    
            _onMessage(event) {
              const message = event.data;
    
              if (this._targetOrigin !== '*' && event.origin !== this._targetOrigin || event.source !== this._targetWindow || !(0, utils_1.isValidStreamMessage)(message) || message.target !== this._name) {
                return;
              }
    
              this._onData(message.data);
            }
    
            _destroy() {
              window.removeEventListener('message', this._onMessage, false);
            }
    
          }
    
          exports.WindowPostMessageStream = WindowPostMessageStream;
        }, {
          "../BasePostMessageStream": 1,
          "../utils": 2
        }],
        4: [function (require, module, exports) {
          "use strict";
    
          var __classPrivateFieldSet = this && this.__classPrivateFieldSet || function (receiver, state, value, kind, f) {
            if (kind === "m") throw new TypeError("Private method is not writable");
            if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
            if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
            return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
          };
    
          var __classPrivateFieldGet = this && this.__classPrivateFieldGet || function (receiver, state, kind, f) {
            if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
            if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
            return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
          };
    
          var _FrozenMap_map, _FrozenSet_set;
    
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.FrozenSet = exports.FrozenMap = void 0;
          /**
           * A {@link ReadonlyMap} that cannot be modified after instantiation.
           * The implementation uses an inner map hidden via a private field, and the
           * immutability guarantee relies on it being impossible to get a reference
           * to this map.
           */
    
          class FrozenMap {
            constructor(entries) {
              _FrozenMap_map.set(this, void 0);
    
              __classPrivateFieldSet(this, _FrozenMap_map, new Map(entries), "f");
    
              Object.freeze(this);
            }
    
            get size() {
              return __classPrivateFieldGet(this, _FrozenMap_map, "f").size;
            }
    
            [(_FrozenMap_map = new WeakMap(), Symbol.iterator)]() {
              return __classPrivateFieldGet(this, _FrozenMap_map, "f")[Symbol.iterator]();
            }
    
            entries() {
              return __classPrivateFieldGet(this, _FrozenMap_map, "f").entries();
            }
    
            forEach(callbackfn, thisArg) {
              // We have to wrap the specified callback in order to prevent it from
              // receiving a reference to the inner map.
              return __classPrivateFieldGet(this, _FrozenMap_map, "f").forEach((value, key, _map) => callbackfn.call(thisArg, value, key, this));
            }
    
            get(key) {
              return __classPrivateFieldGet(this, _FrozenMap_map, "f").get(key);
            }
    
            has(key) {
              return __classPrivateFieldGet(this, _FrozenMap_map, "f").has(key);
            }
    
            keys() {
              return __classPrivateFieldGet(this, _FrozenMap_map, "f").keys();
            }
    
            values() {
              return __classPrivateFieldGet(this, _FrozenMap_map, "f").values();
            }
    
            toString() {
              return `FrozenMap(${this.size}) {${this.size > 0 ? ` ${[...this.entries()].map(([key, value]) => `${String(key)} => ${String(value)}`).join(', ')} ` : ''}}`;
            }
    
          }
    
          exports.FrozenMap = FrozenMap;
          /**
           * A {@link ReadonlySet} that cannot be modified after instantiation.
           * The implementation uses an inner set hidden via a private field, and the
           * immutability guarantee relies on it being impossible to get a reference
           * to this set.
           */
    
          class FrozenSet {
            constructor(values) {
              _FrozenSet_set.set(this, void 0);
    
              __classPrivateFieldSet(this, _FrozenSet_set, new Set(values), "f");
    
              Object.freeze(this);
            }
    
            get size() {
              return __classPrivateFieldGet(this, _FrozenSet_set, "f").size;
            }
    
            [(_FrozenSet_set = new WeakMap(), Symbol.iterator)]() {
              return __classPrivateFieldGet(this, _FrozenSet_set, "f")[Symbol.iterator]();
            }
    
            entries() {
              return __classPrivateFieldGet(this, _FrozenSet_set, "f").entries();
            }
    
            forEach(callbackfn, thisArg) {
              // We have to wrap the specified callback in order to prevent it from
              // receiving a reference to the inner set.
              return __classPrivateFieldGet(this, _FrozenSet_set, "f").forEach((value, value2, _set) => callbackfn.call(thisArg, value, value2, this));
            }
    
            has(value) {
              return __classPrivateFieldGet(this, _FrozenSet_set, "f").has(value);
            }
    
            keys() {
              return __classPrivateFieldGet(this, _FrozenSet_set, "f").keys();
            }
    
            values() {
              return __classPrivateFieldGet(this, _FrozenSet_set, "f").values();
            }
    
            toString() {
              return `FrozenSet(${this.size}) {${this.size > 0 ? ` ${[...this.values()].map(member => String(member)).join(', ')} ` : ''}}`;
            }
    
          }
    
          exports.FrozenSet = FrozenSet;
          Object.freeze(FrozenMap);
          Object.freeze(FrozenMap.prototype);
          Object.freeze(FrozenSet);
          Object.freeze(FrozenSet.prototype);
        }, {}],
        5: [function (require, module, exports) {
          "use strict";
    
          var __createBinding = this && this.__createBinding || (Object.create ? function (o, m, k, k2) {
            if (k2 === undefined) k2 = k;
            var desc = Object.getOwnPropertyDescriptor(m, k);
    
            if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
              desc = {
                enumerable: true,
                get: function () {
                  return m[k];
                }
              };
            }
    
            Object.defineProperty(o, k2, desc);
          } : function (o, m, k, k2) {
            if (k2 === undefined) k2 = k;
            o[k2] = m[k];
          });
    
          var __exportStar = this && this.__exportStar || function (m, exports) {
            for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
          };
    
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
    
          __exportStar(require("./collections"), exports);
    
          __exportStar(require("./json"), exports);
    
          __exportStar(require("./logging"), exports);
    
          __exportStar(require("./misc"), exports);
    
          __exportStar(require("./time"), exports);
        }, {
          "./collections": 4,
          "./json": 6,
          "./logging": 7,
          "./misc": 8,
          "./time": 9
        }],
        6: [function (require, module, exports) {
          "use strict";
    
          var __importDefault = this && this.__importDefault || function (mod) {
            return mod && mod.__esModule ? mod : {
              "default": mod
            };
          };
    
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.validateJsonAndGetSize = exports.getJsonRpcIdValidator = exports.assertIsJsonRpcFailure = exports.isJsonRpcFailure = exports.assertIsJsonRpcSuccess = exports.isJsonRpcSuccess = exports.assertIsJsonRpcResponse = exports.isJsonRpcResponse = exports.JsonRpcResponseStruct = exports.JsonRpcFailureStruct = exports.JsonRpcSuccessStruct = exports.assertIsJsonRpcRequest = exports.isJsonRpcRequest = exports.assertIsJsonRpcNotification = exports.isJsonRpcNotification = exports.JsonRpcNotificationStruct = exports.JsonRpcRequestStruct = exports.JsonRpcParamsStruct = exports.JsonRpcErrorStruct = exports.JsonRpcIdStruct = exports.JsonRpcVersionStruct = exports.jsonrpc2 = exports.isValidJson = exports.JsonStruct = void 0;
    
          const fast_deep_equal_1 = __importDefault(require("fast-deep-equal"));
    
          const superstruct_1 = require("superstruct");
    
          const misc_1 = require("./misc");
          /**
           * Type guard for determining whether the given value is an error object with a
           * `message` property, such as an instance of Error.
           *
           * @param error - The object to check.
           * @returns True or false, depending on the result.
           */
    
    
          function isErrorWithMessage(error) {
            return typeof error === 'object' && error !== null && 'message' in error;
          } // Note: This struct references itself, so TypeScript cannot infer the type.
    
    
          exports.JsonStruct = (0, superstruct_1.union)([(0, superstruct_1.literal)(null), (0, superstruct_1.boolean)(), (0, superstruct_1.number)(), (0, superstruct_1.string)(), (0, superstruct_1.lazy)(() => (0, superstruct_1.array)(exports.JsonStruct)), (0, superstruct_1.lazy)(() => (0, superstruct_1.record)((0, superstruct_1.string)(), exports.JsonStruct))]);
          /**
           * Type guard for {@link Json}.
           *
           * @param value - The value to check.
           * @returns Whether the value is valid JSON.
           */
    
          function isValidJson(value) {
            try {
              return (0, fast_deep_equal_1.default)(value, JSON.parse(JSON.stringify(value)));
            } catch (_) {
              return false;
            }
          }
    
          exports.isValidJson = isValidJson;
          /**
           * The string '2.0'.
           */
    
          exports.jsonrpc2 = '2.0';
          exports.JsonRpcVersionStruct = (0, superstruct_1.literal)(exports.jsonrpc2);
          exports.JsonRpcIdStruct = (0, superstruct_1.nullable)((0, superstruct_1.union)([(0, superstruct_1.number)(), (0, superstruct_1.string)()]));
          exports.JsonRpcErrorStruct = (0, superstruct_1.object)({
            code: (0, superstruct_1.number)(),
            message: (0, superstruct_1.string)(),
            data: (0, superstruct_1.optional)((0, superstruct_1.unknown)()),
            stack: (0, superstruct_1.optional)((0, superstruct_1.string)())
          });
          exports.JsonRpcParamsStruct = (0, superstruct_1.optional)((0, superstruct_1.union)([(0, superstruct_1.object)(), (0, superstruct_1.array)()]));
          exports.JsonRpcRequestStruct = (0, superstruct_1.object)({
            id: exports.JsonRpcIdStruct,
            jsonrpc: exports.JsonRpcVersionStruct,
            method: (0, superstruct_1.string)(),
            params: exports.JsonRpcParamsStruct
          });
          exports.JsonRpcNotificationStruct = (0, superstruct_1.omit)(exports.JsonRpcRequestStruct, ['id']);
          /**
           * Type guard to narrow a JSON-RPC request or notification object to a
           * notification.
           *
           * @param requestOrNotification - The JSON-RPC request or notification to check.
           * @returns Whether the specified JSON-RPC message is a notification.
           */
    
          function isJsonRpcNotification(requestOrNotification) {
            return (0, superstruct_1.is)(requestOrNotification, exports.JsonRpcNotificationStruct);
          }
    
          exports.isJsonRpcNotification = isJsonRpcNotification;
          /**
           * Assertion type guard to narrow a JSON-RPC request or notification object to a
           * notification.
           *
           * @param requestOrNotification - The JSON-RPC request or notification to check.
           */
    
          function assertIsJsonRpcNotification(requestOrNotification) {
            try {
              (0, superstruct_1.assert)(requestOrNotification, exports.JsonRpcNotificationStruct);
            } catch (error) {
              const message = isErrorWithMessage(error) ? error.message : error;
              throw new Error(`Not a JSON-RPC notification: ${message}.`);
            }
          }
    
          exports.assertIsJsonRpcNotification = assertIsJsonRpcNotification;
          /**
           * Type guard to narrow a JSON-RPC request or notification object to a request.
           *
           * @param requestOrNotification - The JSON-RPC request or notification to check.
           * @returns Whether the specified JSON-RPC message is a request.
           */
    
          function isJsonRpcRequest(requestOrNotification) {
            return (0, superstruct_1.is)(requestOrNotification, exports.JsonRpcRequestStruct);
          }
    
          exports.isJsonRpcRequest = isJsonRpcRequest;
          /**
           * Assertion type guard to narrow a JSON-RPC request or notification object to a
           * request.
           *
           * @param requestOrNotification - The JSON-RPC request or notification to check.
           */
    
          function assertIsJsonRpcRequest(requestOrNotification) {
            try {
              (0, superstruct_1.assert)(requestOrNotification, exports.JsonRpcRequestStruct);
            } catch (error) {
              const message = isErrorWithMessage(error) ? error.message : error;
              throw new Error(`Not a JSON-RPC request: ${message}.`);
            }
          }
    
          exports.assertIsJsonRpcRequest = assertIsJsonRpcRequest;
          exports.JsonRpcSuccessStruct = (0, superstruct_1.object)({
            id: exports.JsonRpcIdStruct,
            jsonrpc: exports.JsonRpcVersionStruct,
            result: exports.JsonStruct
          });
          exports.JsonRpcFailureStruct = (0, superstruct_1.object)({
            id: exports.JsonRpcIdStruct,
            jsonrpc: exports.JsonRpcVersionStruct,
            error: exports.JsonRpcErrorStruct
          });
          exports.JsonRpcResponseStruct = (0, superstruct_1.union)([exports.JsonRpcSuccessStruct, exports.JsonRpcFailureStruct]);
          /**
           * Type guard to check if a value is a JsonRpcResponse.
           *
           * @param response - The object to check.
           * @returns Whether the object is a JsonRpcResponse.
           */
    
          function isJsonRpcResponse(response) {
            return (0, superstruct_1.is)(response, exports.JsonRpcResponseStruct);
          }
    
          exports.isJsonRpcResponse = isJsonRpcResponse;
          /**
           * Type assertion to check if a value is a JsonRpcResponse.
           *
           * @param response - The response to check.
           */
    
          function assertIsJsonRpcResponse(response) {
            try {
              (0, superstruct_1.assert)(response, exports.JsonRpcResponseStruct);
            } catch (error) {
              const message = isErrorWithMessage(error) ? error.message : error;
              throw new Error(`Not a JSON-RPC response: ${message}.`);
            }
          }
    
          exports.assertIsJsonRpcResponse = assertIsJsonRpcResponse;
          /**
           * Type guard to narrow a JsonRpcResponse object to a success (or failure).
           *
           * @param response - The response object to check.
           * @returns Whether the response object is a success.
           */
    
          function isJsonRpcSuccess(response) {
            return (0, superstruct_1.is)(response, exports.JsonRpcSuccessStruct);
          }
    
          exports.isJsonRpcSuccess = isJsonRpcSuccess;
          /**
           * Type assertion to narrow a JsonRpcResponse object to a success (or failure).
           *
           * @param response - The response object to check.
           */
    
          function assertIsJsonRpcSuccess(response) {
            try {
              (0, superstruct_1.assert)(response, exports.JsonRpcSuccessStruct);
            } catch (error) {
              const message = isErrorWithMessage(error) ? error.message : error;
              throw new Error(`Not a successful JSON-RPC response: ${message}.`);
            }
          }
    
          exports.assertIsJsonRpcSuccess = assertIsJsonRpcSuccess;
          /**
           * Type guard to narrow a JsonRpcResponse object to a failure (or success).
           *
           * @param response - The response object to check.
           * @returns Whether the response object is a failure, i.e. has an `error`
           * property.
           */
    
          function isJsonRpcFailure(response) {
            return (0, superstruct_1.is)(response, exports.JsonRpcFailureStruct);
          }
    
          exports.isJsonRpcFailure = isJsonRpcFailure;
          /**
           * Type assertion to narrow a JsonRpcResponse object to a failure (or success).
           *
           * @param response - The response object to check.
           */
    
          function assertIsJsonRpcFailure(response) {
            try {
              (0, superstruct_1.assert)(response, exports.JsonRpcFailureStruct);
            } catch (error) {
              const message = isErrorWithMessage(error) ? error.message : error;
              throw new Error(`Not a failed JSON-RPC response: ${message}.`);
            }
          }
    
          exports.assertIsJsonRpcFailure = assertIsJsonRpcFailure;
          /**
           * Gets a function for validating JSON-RPC request / response `id` values.
           *
           * By manipulating the options of this factory, you can control the behavior
           * of the resulting validator for some edge cases. This is useful because e.g.
           * `null` should sometimes but not always be permitted.
           *
           * Note that the empty string (`''`) is always permitted by the JSON-RPC
           * specification, but that kind of sucks and you may want to forbid it in some
           * instances anyway.
           *
           * For more details, see the
           * [JSON-RPC Specification](https://www.jsonrpc.org/specification).
           *
           * @param options - An options object.
           * @param options.permitEmptyString - Whether the empty string (i.e. `''`)
           * should be treated as a valid ID. Default: `true`
           * @param options.permitFractions - Whether fractional numbers (e.g. `1.2`)
           * should be treated as valid IDs. Default: `false`
           * @param options.permitNull - Whether `null` should be treated as a valid ID.
           * Default: `true`
           * @returns The JSON-RPC ID validator function.
           */
    
          function getJsonRpcIdValidator(options) {
            const {
              permitEmptyString,
              permitFractions,
              permitNull
            } = Object.assign({
              permitEmptyString: true,
              permitFractions: false,
              permitNull: true
            }, options);
            /**
             * Type guard for {@link JsonRpcId}.
             *
             * @param id - The JSON-RPC ID value to check.
             * @returns Whether the given ID is valid per the options given to the
             * factory.
             */
    
            const isValidJsonRpcId = id => {
              return Boolean(typeof id === 'number' && (permitFractions || Number.isInteger(id)) || typeof id === 'string' && (permitEmptyString || id.length > 0) || permitNull && id === null);
            };
    
            return isValidJsonRpcId;
          }
    
          exports.getJsonRpcIdValidator = getJsonRpcIdValidator;
          /**
           * Checks whether a value is JSON serializable and counts the total number
           * of bytes needed to store the serialized version of the value.
           *
           * @param jsObject - Potential JSON serializable object.
           * @param skipSizingProcess - Skip JSON size calculation (default: false).
           * @returns Tuple [isValid, plainTextSizeInBytes] containing a boolean that signals whether
           * the value was serializable and a number of bytes that it will use when serialized to JSON.
           */
    
          function validateJsonAndGetSize(jsObject, skipSizingProcess = false) {
            const seenObjects = new Set();
            /**
             * Checks whether a value is JSON serializable and counts the total number
             * of bytes needed to store the serialized version of the value.
             *
             * This function assumes the encoding of the JSON is done in UTF-8.
             *
             * @param value - Potential JSON serializable value.
             * @param skipSizing - Skip JSON size calculation (default: false).
             * @returns Tuple [isValid, plainTextSizeInBytes] containing a boolean that signals whether
             * the value was serializable and a number of bytes that it will use when serialized to JSON.
             */
    
            function getJsonSerializableInfo(value, skipSizing) {
              if (value === undefined) {
                // Return zero for undefined, since these are omitted from JSON serialization
                return [true, 0];
              } else if (value === null) {
                // Return already specified constant size for null (special object)
                return [true, skipSizing ? 0 : misc_1.JsonSize.Null];
              } // Check and calculate sizes for basic (and some special) types
    
    
              const typeOfValue = typeof value;
    
              try {
                if (typeOfValue === 'function') {
                  return [false, 0];
                } else if (typeOfValue === 'string' || value instanceof String) {
                  return [true, skipSizing ? 0 : (0, misc_1.calculateStringSize)(value) + misc_1.JsonSize.Quote * 2];
                } else if (typeOfValue === 'boolean' || value instanceof Boolean) {
                  if (skipSizing) {
                    return [true, 0];
                  } // eslint-disable-next-line eqeqeq
    
    
                  return [true, value == true ? misc_1.JsonSize.True : misc_1.JsonSize.False];
                } else if (typeOfValue === 'number' || value instanceof Number) {
                  if (skipSizing) {
                    return [true, 0];
                  }
    
                  return [true, (0, misc_1.calculateNumberSize)(value)];
                } else if (value instanceof Date) {
                  if (skipSizing) {
                    return [true, 0];
                  }
    
                  return [true, // Note: Invalid dates will serialize to null
                  isNaN(value.getDate()) ? misc_1.JsonSize.Null : misc_1.JsonSize.Date + misc_1.JsonSize.Quote * 2];
                }
              } catch (_) {
                return [false, 0];
              } // If object is not plain and cannot be serialized properly,
              // stop here and return false for serialization
    
    
              if (!(0, misc_1.isPlainObject)(value) && !Array.isArray(value)) {
                return [false, 0];
              } // Circular object detection (handling)
              // Check if the same object already exists
    
    
              if (seenObjects.has(value)) {
                return [false, 0];
              } // Add new object to the seen objects set
              // Only the plain objects should be added (Primitive types are skipped)
    
    
              seenObjects.add(value); // Continue object decomposition
    
              try {
                return [true, Object.entries(value).reduce((sum, [key, nestedValue], idx, arr) => {
                  // Recursively process next nested object or primitive type
                  // eslint-disable-next-line prefer-const
                  let [valid, size] = getJsonSerializableInfo(nestedValue, skipSizing);
    
                  if (!valid) {
                    throw new Error('JSON validation did not pass. Validation process stopped.');
                  } // Circular object detection
                  // Once a child node is visited and processed remove it from the set.
                  // This will prevent false positives with the same adjacent objects.
    
    
                  seenObjects.delete(value);
    
                  if (skipSizing) {
                    return 0;
                  } // If the size is 0, the value is undefined and undefined in an array
                  // when serialized will be replaced with null
    
    
                  if (size === 0 && Array.isArray(value)) {
                    size = misc_1.JsonSize.Null;
                  } // If the size is 0, that means the object is undefined and
                  // the rest of the object structure will be omitted
    
    
                  if (size === 0) {
                    return sum;
                  } // Objects will have be serialized with "key": value,
                  // therefore we include the key in the calculation here
    
    
                  const keySize = Array.isArray(value) ? 0 : key.length + misc_1.JsonSize.Comma + misc_1.JsonSize.Colon * 2;
                  const separator = idx < arr.length - 1 ? misc_1.JsonSize.Comma : 0;
                  return sum + keySize + size + separator;
                }, // Starts at 2 because the serialized JSON string data (plain text)
                // will minimally contain {}/[]
                skipSizing ? 0 : misc_1.JsonSize.Wrapper * 2)];
              } catch (_) {
                return [false, 0];
              }
            }
    
            return getJsonSerializableInfo(jsObject, skipSizingProcess);
          }
    
          exports.validateJsonAndGetSize = validateJsonAndGetSize;
        }, {
          "./misc": 8,
          "fast-deep-equal": 17,
          "superstruct": 36
        }],
        7: [function (require, module, exports) {
          "use strict";
    
          var __importDefault = this && this.__importDefault || function (mod) {
            return mod && mod.__esModule ? mod : {
              "default": mod
            };
          };
    
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.createModuleLogger = exports.createProjectLogger = void 0;
    
          const debug_1 = __importDefault(require("debug"));
    
          const globalLogger = (0, debug_1.default)('metamask');
          /**
           * Creates a logger via the `debug` library whose log messages will be tagged
           * using the name of your project. By default, such messages will be
           * suppressed, but you can reveal them by setting the `DEBUG` environment
           * variable to `metamask:<projectName>`. You can also set this variable to
           * `metamask:*` if you want to see log messages from all MetaMask projects that
           * are also using this function to create their loggers.
           *
           * @param projectName - The name of your project. This should be the name of
           * your NPM package if you're developing one.
           * @returns An instance of `debug`.
           */
    
          function createProjectLogger(projectName) {
            return globalLogger.extend(projectName);
          }
    
          exports.createProjectLogger = createProjectLogger;
          /**
           * Creates a logger via the `debug` library which is derived from the logger for
           * the whole project whose log messages will be tagged using the name of your
           * module. By default, such messages will be suppressed, but you can reveal them
           * by setting the `DEBUG` environment variable to
           * `metamask:<projectName>:<moduleName>`. You can also set this variable to
           * `metamask:<projectName>:*` if you want to see log messages from the project,
           * or `metamask:*` if you want to see log messages from all MetaMask projects.
           *
           * @param projectLogger - The logger created via {@link createProjectLogger}.
           * @param moduleName - The name of your module. You could use the name of the
           * file where you're using this logger or some other name.
           * @returns An instance of `debug`.
           */
    
          function createModuleLogger(projectLogger, moduleName) {
            return projectLogger.extend(moduleName);
          }
    
          exports.createModuleLogger = createModuleLogger;
        }, {
          "debug": 14
        }],
        8: [function (require, module, exports) {
          "use strict"; //
          // Types
          //
    
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.calculateNumberSize = exports.calculateStringSize = exports.isASCII = exports.isPlainObject = exports.ESCAPE_CHARACTERS_REGEXP = exports.JsonSize = exports.hasProperty = exports.isObject = exports.isNullOrUndefined = exports.isNonEmptyArray = void 0; //
          // Type Guards
          //
    
          /**
           * A {@link NonEmptyArray} type guard.
           *
           * @template Element - The non-empty array member type.
           * @param value - The value to check.
           * @returns Whether the value is a non-empty array.
           */
    
          function isNonEmptyArray(value) {
            return Array.isArray(value) && value.length > 0;
          }
    
          exports.isNonEmptyArray = isNonEmptyArray;
          /**
           * Type guard for "nullishness".
           *
           * @param value - Any value.
           * @returns `true` if the value is null or undefined, `false` otherwise.
           */
    
          function isNullOrUndefined(value) {
            return value === null || value === undefined;
          }
    
          exports.isNullOrUndefined = isNullOrUndefined;
          /**
           * A type guard for {@link RuntimeObject}.
           *
           * @param value - The value to check.
           * @returns Whether the specified value has a runtime type of `object` and is
           * neither `null` nor an `Array`.
           */
    
          function isObject(value) {
            return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
          }
    
          exports.isObject = isObject; //
          // Other utility functions
          //
    
          /**
           * An alias for {@link Object.hasOwnProperty}.
           *
           * @param object - The object to check.
           * @param name - The property name to check for.
           * @returns Whether the specified object has an own property with the specified
           * name, regardless of whether it is enumerable or not.
           */
    
          const hasProperty = (object, name) => Object.hasOwnProperty.call(object, name);
    
          exports.hasProperty = hasProperty;
          /**
           * Predefined sizes (in Bytes) of specific parts of JSON structure.
           */
    
          var JsonSize;
    
          (function (JsonSize) {
            JsonSize[JsonSize["Null"] = 4] = "Null";
            JsonSize[JsonSize["Comma"] = 1] = "Comma";
            JsonSize[JsonSize["Wrapper"] = 1] = "Wrapper";
            JsonSize[JsonSize["True"] = 4] = "True";
            JsonSize[JsonSize["False"] = 5] = "False";
            JsonSize[JsonSize["Quote"] = 1] = "Quote";
            JsonSize[JsonSize["Colon"] = 1] = "Colon";
            JsonSize[JsonSize["Date"] = 24] = "Date";
          })(JsonSize = exports.JsonSize || (exports.JsonSize = {}));
          /**
           * Regular expression with pattern matching for (special) escaped characters.
           */
    
    
          exports.ESCAPE_CHARACTERS_REGEXP = /"|\\|\n|\r|\t/gu;
          /**
           * Check if the value is plain object.
           *
           * @param value - Value to be checked.
           * @returns True if an object is the plain JavaScript object,
           * false if the object is not plain (e.g. function).
           */
    
          function isPlainObject(value) {
            if (typeof value !== 'object' || value === null) {
              return false;
            }
    
            try {
              let proto = value;
    
              while (Object.getPrototypeOf(proto) !== null) {
                proto = Object.getPrototypeOf(proto);
              }
    
              return Object.getPrototypeOf(value) === proto;
            } catch (_) {
              return false;
            }
          }
    
          exports.isPlainObject = isPlainObject;
          /**
           * Check if character is ASCII.
           *
           * @param character - Character.
           * @returns True if a character code is ASCII, false if not.
           */
    
          function isASCII(character) {
            return character.charCodeAt(0) <= 127;
          }
    
          exports.isASCII = isASCII;
          /**
           * Calculate string size.
           *
           * @param value - String value to calculate size.
           * @returns Number of bytes used to store whole string value.
           */
    
          function calculateStringSize(value) {
            var _a;
    
            const size = value.split('').reduce((total, character) => {
              if (isASCII(character)) {
                return total + 1;
              }
    
              return total + 2;
            }, 0); // Also detect characters that need backslash escape
    
            return size + ((_a = value.match(exports.ESCAPE_CHARACTERS_REGEXP)) !== null && _a !== void 0 ? _a : []).length;
          }
    
          exports.calculateStringSize = calculateStringSize;
          /**
           * Calculate size of a number ofter JSON serialization.
           *
           * @param value - Number value to calculate size.
           * @returns Number of bytes used to store whole number in JSON.
           */
    
          function calculateNumberSize(value) {
            return value.toString().length;
          }
    
          exports.calculateNumberSize = calculateNumberSize;
        }, {}],
        9: [function (require, module, exports) {
          "use strict";
    
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.timeSince = exports.inMilliseconds = exports.Duration = void 0;
          /**
           * Common duration constants, in milliseconds.
           */
    
          var Duration;
    
          (function (Duration) {
            /**
             * A millisecond.
             */
            Duration[Duration["Millisecond"] = 1] = "Millisecond";
            /**
             * A second, in milliseconds.
             */
    
            Duration[Duration["Second"] = 1000] = "Second";
            /**
             * A minute, in milliseconds.
             */
    
            Duration[Duration["Minute"] = 60000] = "Minute";
            /**
             * An hour, in milliseconds.
             */
    
            Duration[Duration["Hour"] = 3600000] = "Hour";
            /**
             * A day, in milliseconds.
             */
    
            Duration[Duration["Day"] = 86400000] = "Day";
            /**
             * A week, in milliseconds.
             */
    
            Duration[Duration["Week"] = 604800000] = "Week";
            /**
             * A year, in milliseconds.
             */
    
            Duration[Duration["Year"] = 31536000000] = "Year";
          })(Duration = exports.Duration || (exports.Duration = {}));
    
          const isNonNegativeInteger = number => Number.isInteger(number) && number >= 0;
    
          const assertIsNonNegativeInteger = (number, name) => {
            if (!isNonNegativeInteger(number)) {
              throw new Error(`"${name}" must be a non-negative integer. Received: "${number}".`);
            }
          };
          /**
           * Calculates the millisecond value of the specified number of units of time.
           *
           * @param count - The number of units of time.
           * @param duration - The unit of time to count.
           * @returns The count multiplied by the specified duration.
           */
    
    
          function inMilliseconds(count, duration) {
            assertIsNonNegativeInteger(count, 'count');
            return count * duration;
          }
    
          exports.inMilliseconds = inMilliseconds;
          /**
           * Gets the milliseconds since a particular Unix epoch timestamp.
           *
           * @param timestamp - A Unix millisecond timestamp.
           * @returns The number of milliseconds elapsed since the specified timestamp.
           */
    
          function timeSince(timestamp) {
            assertIsNonNegativeInteger(timestamp, 'timestamp');
            return Date.now() - timestamp;
          }
    
          exports.timeSince = timeSince;
        }, {}],
        10: [function (require, module, exports) {
          'use strict';
    
          exports.byteLength = byteLength;
          exports.toByteArray = toByteArray;
          exports.fromByteArray = fromByteArray;
          var lookup = [];
          var revLookup = [];
          var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
          var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    
          for (var i = 0, len = code.length; i < len; ++i) {
            lookup[i] = code[i];
            revLookup[code.charCodeAt(i)] = i;
          } // Support decoding URL-safe base64 strings, as Node.js does.
          // See: https://en.wikipedia.org/wiki/Base64#URL_applications
    
    
          revLookup['-'.charCodeAt(0)] = 62;
          revLookup['_'.charCodeAt(0)] = 63;
    
          function getLens(b64) {
            var len = b64.length;
    
            if (len % 4 > 0) {
              throw new Error('Invalid string. Length must be a multiple of 4');
            } // Trim off extra bytes after placeholder bytes are found
            // See: https://github.com/beatgammit/base64-js/issues/42
    
    
            var validLen = b64.indexOf('=');
            if (validLen === -1) validLen = len;
            var placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
            return [validLen, placeHoldersLen];
          } // base64 is 4/3 + up to two characters of the original data
    
    
          function byteLength(b64) {
            var lens = getLens(b64);
            var validLen = lens[0];
            var placeHoldersLen = lens[1];
            return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
          }
    
          function _byteLength(b64, validLen, placeHoldersLen) {
            return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
          }
    
          function toByteArray(b64) {
            var tmp;
            var lens = getLens(b64);
            var validLen = lens[0];
            var placeHoldersLen = lens[1];
            var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
            var curByte = 0; // if there are placeholders, only get up to the last complete 4 chars
    
            var len = placeHoldersLen > 0 ? validLen - 4 : validLen;
            var i;
    
            for (i = 0; i < len; i += 4) {
              tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
              arr[curByte++] = tmp >> 16 & 0xFF;
              arr[curByte++] = tmp >> 8 & 0xFF;
              arr[curByte++] = tmp & 0xFF;
            }
    
            if (placeHoldersLen === 2) {
              tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
              arr[curByte++] = tmp & 0xFF;
            }
    
            if (placeHoldersLen === 1) {
              tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
              arr[curByte++] = tmp >> 8 & 0xFF;
              arr[curByte++] = tmp & 0xFF;
            }
    
            return arr;
          }
    
          function tripletToBase64(num) {
            return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
          }
    
          function encodeChunk(uint8, start, end) {
            var tmp;
            var output = [];
    
            for (var i = start; i < end; i += 3) {
              tmp = (uint8[i] << 16 & 0xFF0000) + (uint8[i + 1] << 8 & 0xFF00) + (uint8[i + 2] & 0xFF);
              output.push(tripletToBase64(tmp));
            }
    
            return output.join('');
          }
    
          function fromByteArray(uint8) {
            var tmp;
            var len = uint8.length;
            var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
    
            var parts = [];
            var maxChunkLength = 16383; // must be multiple of 3
            // go through the array every three bytes, we'll deal with trailing stuff later
    
            for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
              parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
            } // pad the end with zeros, but make sure to not forget the extra bytes
    
    
            if (extraBytes === 1) {
              tmp = uint8[len - 1];
              parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 0x3F] + '==');
            } else if (extraBytes === 2) {
              tmp = (uint8[len - 2] << 8) + uint8[len - 1];
              parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 0x3F] + lookup[tmp << 2 & 0x3F] + '=');
            }
    
            return parts.join('');
          }
        }, {}],
        11: [function (require, module, exports) {}, {}],
        12: [function (require, module, exports) {
          (function (Buffer) {
            (function () {
              /*!
               * The buffer module from node.js, for the browser.
               *
               * @author   Feross Aboukhadijeh <https://feross.org>
               * @license  MIT
               */
    
              /* eslint-disable no-proto */
              'use strict';
    
              var base64 = require('base64-js');
    
              var ieee754 = require('ieee754');
    
              exports.Buffer = Buffer;
              exports.SlowBuffer = SlowBuffer;
              exports.INSPECT_MAX_BYTES = 50;
              var K_MAX_LENGTH = 0x7fffffff;
              exports.kMaxLength = K_MAX_LENGTH;
              /**
               * If `Buffer.TYPED_ARRAY_SUPPORT`:
               *   === true    Use Uint8Array implementation (fastest)
               *   === false   Print warning and recommend using `buffer` v4.x which has an Object
               *               implementation (most compatible, even IE6)
               *
               * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
               * Opera 11.6+, iOS 4.2+.
               *
               * We report that the browser does not support typed arrays if the are not subclassable
               * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
               * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
               * for __proto__ and has a buggy typed array implementation.
               */
    
              Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();
    
              if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' && typeof console.error === 'function') {
                console.error('This browser lacks typed array (Uint8Array) support which is required by ' + '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.');
              }
    
              function typedArraySupport() {
                // Can typed array instances can be augmented?
                try {
                  var arr = new Uint8Array(1);
                  arr.__proto__ = {
                    __proto__: Uint8Array.prototype,
                    foo: function () {
                      return 42;
                    }
                  };
                  return arr.foo() === 42;
                } catch (e) {
                  return false;
                }
              }
    
              Object.defineProperty(Buffer.prototype, 'parent', {
                enumerable: true,
                get: function () {
                  if (!Buffer.isBuffer(this)) return undefined;
                  return this.buffer;
                }
              });
              Object.defineProperty(Buffer.prototype, 'offset', {
                enumerable: true,
                get: function () {
                  if (!Buffer.isBuffer(this)) return undefined;
                  return this.byteOffset;
                }
              });
    
              function createBuffer(length) {
                if (length > K_MAX_LENGTH) {
                  throw new RangeError('The value "' + length + '" is invalid for option "size"');
                } // Return an augmented `Uint8Array` instance
    
    
                var buf = new Uint8Array(length);
                buf.__proto__ = Buffer.prototype;
                return buf;
              }
              /**
               * The Buffer constructor returns instances of `Uint8Array` that have their
               * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
               * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
               * and the `Uint8Array` methods. Square bracket notation works as expected -- it
               * returns a single octet.
               *
               * The `Uint8Array` prototype remains unmodified.
               */
    
    
              function Buffer(arg, encodingOrOffset, length) {
                // Common case.
                if (typeof arg === 'number') {
                  if (typeof encodingOrOffset === 'string') {
                    throw new TypeError('The "string" argument must be of type string. Received type number');
                  }
    
                  return allocUnsafe(arg);
                }
    
                return from(arg, encodingOrOffset, length);
              } // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    
    
              if (typeof Symbol !== 'undefined' && Symbol.species != null && Buffer[Symbol.species] === Buffer) {
                Object.defineProperty(Buffer, Symbol.species, {
                  value: null,
                  configurable: true,
                  enumerable: false,
                  writable: false
                });
              }
    
              Buffer.poolSize = 8192; // not used by this implementation
    
              function from(value, encodingOrOffset, length) {
                if (typeof value === 'string') {
                  return fromString(value, encodingOrOffset);
                }
    
                if (ArrayBuffer.isView(value)) {
                  return fromArrayLike(value);
                }
    
                if (value == null) {
                  throw TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + typeof value);
                }
    
                if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
                  return fromArrayBuffer(value, encodingOrOffset, length);
                }
    
                if (typeof value === 'number') {
                  throw new TypeError('The "value" argument must not be of type number. Received type number');
                }
    
                var valueOf = value.valueOf && value.valueOf();
    
                if (valueOf != null && valueOf !== value) {
                  return Buffer.from(valueOf, encodingOrOffset, length);
                }
    
                var b = fromObject(value);
                if (b) return b;
    
                if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === 'function') {
                  return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length);
                }
    
                throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + typeof value);
              }
              /**
               * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
               * if value is a number.
               * Buffer.from(str[, encoding])
               * Buffer.from(array)
               * Buffer.from(buffer)
               * Buffer.from(arrayBuffer[, byteOffset[, length]])
               **/
    
    
              Buffer.from = function (value, encodingOrOffset, length) {
                return from(value, encodingOrOffset, length);
              }; // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
              // https://github.com/feross/buffer/pull/148
    
    
              Buffer.prototype.__proto__ = Uint8Array.prototype;
              Buffer.__proto__ = Uint8Array;
    
              function assertSize(size) {
                if (typeof size !== 'number') {
                  throw new TypeError('"size" argument must be of type number');
                } else if (size < 0) {
                  throw new RangeError('The value "' + size + '" is invalid for option "size"');
                }
              }
    
              function alloc(size, fill, encoding) {
                assertSize(size);
    
                if (size <= 0) {
                  return createBuffer(size);
                }
    
                if (fill !== undefined) {
                  // Only pay attention to encoding if it's a string. This
                  // prevents accidentally sending in a number that would
                  // be interpretted as a start offset.
                  return typeof encoding === 'string' ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
                }
    
                return createBuffer(size);
              }
              /**
               * Creates a new filled Buffer instance.
               * alloc(size[, fill[, encoding]])
               **/
    
    
              Buffer.alloc = function (size, fill, encoding) {
                return alloc(size, fill, encoding);
              };
    
              function allocUnsafe(size) {
                assertSize(size);
                return createBuffer(size < 0 ? 0 : checked(size) | 0);
              }
              /**
               * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
               * */
    
    
              Buffer.allocUnsafe = function (size) {
                return allocUnsafe(size);
              };
              /**
               * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
               */
    
    
              Buffer.allocUnsafeSlow = function (size) {
                return allocUnsafe(size);
              };
    
              function fromString(string, encoding) {
                if (typeof encoding !== 'string' || encoding === '') {
                  encoding = 'utf8';
                }
    
                if (!Buffer.isEncoding(encoding)) {
                  throw new TypeError('Unknown encoding: ' + encoding);
                }
    
                var length = byteLength(string, encoding) | 0;
                var buf = createBuffer(length);
                var actual = buf.write(string, encoding);
    
                if (actual !== length) {
                  // Writing a hex string, for example, that contains invalid characters will
                  // cause everything after the first invalid character to be ignored. (e.g.
                  // 'abxxcd' will be treated as 'ab')
                  buf = buf.slice(0, actual);
                }
    
                return buf;
              }
    
              function fromArrayLike(array) {
                var length = array.length < 0 ? 0 : checked(array.length) | 0;
                var buf = createBuffer(length);
    
                for (var i = 0; i < length; i += 1) {
                  buf[i] = array[i] & 255;
                }
    
                return buf;
              }
    
              function fromArrayBuffer(array, byteOffset, length) {
                if (byteOffset < 0 || array.byteLength < byteOffset) {
                  throw new RangeError('"offset" is outside of buffer bounds');
                }
    
                if (array.byteLength < byteOffset + (length || 0)) {
                  throw new RangeError('"length" is outside of buffer bounds');
                }
    
                var buf;
    
                if (byteOffset === undefined && length === undefined) {
                  buf = new Uint8Array(array);
                } else if (length === undefined) {
                  buf = new Uint8Array(array, byteOffset);
                } else {
                  buf = new Uint8Array(array, byteOffset, length);
                } // Return an augmented `Uint8Array` instance
    
    
                buf.__proto__ = Buffer.prototype;
                return buf;
              }
    
              function fromObject(obj) {
                if (Buffer.isBuffer(obj)) {
                  var len = checked(obj.length) | 0;
                  var buf = createBuffer(len);
    
                  if (buf.length === 0) {
                    return buf;
                  }
    
                  obj.copy(buf, 0, 0, len);
                  return buf;
                }
    
                if (obj.length !== undefined) {
                  if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
                    return createBuffer(0);
                  }
    
                  return fromArrayLike(obj);
                }
    
                if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
                  return fromArrayLike(obj.data);
                }
              }
    
              function checked(length) {
                // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
                // length is NaN (which is otherwise coerced to zero.)
                if (length >= K_MAX_LENGTH) {
                  throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes');
                }
    
                return length | 0;
              }
    
              function SlowBuffer(length) {
                if (+length != length) {
                  // eslint-disable-line eqeqeq
                  length = 0;
                }
    
                return Buffer.alloc(+length);
              }
    
              Buffer.isBuffer = function isBuffer(b) {
                return b != null && b._isBuffer === true && b !== Buffer.prototype; // so Buffer.isBuffer(Buffer.prototype) will be false
              };
    
              Buffer.compare = function compare(a, b) {
                if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength);
                if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength);
    
                if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
                  throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
                }
    
                if (a === b) return 0;
                var x = a.length;
                var y = b.length;
    
                for (var i = 0, len = Math.min(x, y); i < len; ++i) {
                  if (a[i] !== b[i]) {
                    x = a[i];
                    y = b[i];
                    break;
                  }
                }
    
                if (x < y) return -1;
                if (y < x) return 1;
                return 0;
              };
    
              Buffer.isEncoding = function isEncoding(encoding) {
                switch (String(encoding).toLowerCase()) {
                  case 'hex':
                  case 'utf8':
                  case 'utf-8':
                  case 'ascii':
                  case 'latin1':
                  case 'binary':
                  case 'base64':
                  case 'ucs2':
                  case 'ucs-2':
                  case 'utf16le':
                  case 'utf-16le':
                    return true;
    
                  default:
                    return false;
                }
              };
    
              Buffer.concat = function concat(list, length) {
                if (!Array.isArray(list)) {
                  throw new TypeError('"list" argument must be an Array of Buffers');
                }
    
                if (list.length === 0) {
                  return Buffer.alloc(0);
                }
    
                var i;
    
                if (length === undefined) {
                  length = 0;
    
                  for (i = 0; i < list.length; ++i) {
                    length += list[i].length;
                  }
                }
    
                var buffer = Buffer.allocUnsafe(length);
                var pos = 0;
    
                for (i = 0; i < list.length; ++i) {
                  var buf = list[i];
    
                  if (isInstance(buf, Uint8Array)) {
                    buf = Buffer.from(buf);
                  }
    
                  if (!Buffer.isBuffer(buf)) {
                    throw new TypeError('"list" argument must be an Array of Buffers');
                  }
    
                  buf.copy(buffer, pos);
                  pos += buf.length;
                }
    
                return buffer;
              };
    
              function byteLength(string, encoding) {
                if (Buffer.isBuffer(string)) {
                  return string.length;
                }
    
                if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
                  return string.byteLength;
                }
    
                if (typeof string !== 'string') {
                  throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' + 'Received type ' + typeof string);
                }
    
                var len = string.length;
                var mustMatch = arguments.length > 2 && arguments[2] === true;
                if (!mustMatch && len === 0) return 0; // Use a for loop to avoid recursion
    
                var loweredCase = false;
    
                for (;;) {
                  switch (encoding) {
                    case 'ascii':
                    case 'latin1':
                    case 'binary':
                      return len;
    
                    case 'utf8':
                    case 'utf-8':
                      return utf8ToBytes(string).length;
    
                    case 'ucs2':
                    case 'ucs-2':
                    case 'utf16le':
                    case 'utf-16le':
                      return len * 2;
    
                    case 'hex':
                      return len >>> 1;
    
                    case 'base64':
                      return base64ToBytes(string).length;
    
                    default:
                      if (loweredCase) {
                        return mustMatch ? -1 : utf8ToBytes(string).length; // assume utf8
                      }
    
                      encoding = ('' + encoding).toLowerCase();
                      loweredCase = true;
                  }
                }
              }
    
              Buffer.byteLength = byteLength;
    
              function slowToString(encoding, start, end) {
                var loweredCase = false; // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
                // property of a typed array.
                // This behaves neither like String nor Uint8Array in that we set start/end
                // to their upper/lower bounds if the value passed is out of range.
                // undefined is handled specially as per ECMA-262 6th Edition,
                // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
    
                if (start === undefined || start < 0) {
                  start = 0;
                } // Return early if start > this.length. Done here to prevent potential uint32
                // coercion fail below.
    
    
                if (start > this.length) {
                  return '';
                }
    
                if (end === undefined || end > this.length) {
                  end = this.length;
                }
    
                if (end <= 0) {
                  return '';
                } // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
    
    
                end >>>= 0;
                start >>>= 0;
    
                if (end <= start) {
                  return '';
                }
    
                if (!encoding) encoding = 'utf8';
    
                while (true) {
                  switch (encoding) {
                    case 'hex':
                      return hexSlice(this, start, end);
    
                    case 'utf8':
                    case 'utf-8':
                      return utf8Slice(this, start, end);
    
                    case 'ascii':
                      return asciiSlice(this, start, end);
    
                    case 'latin1':
                    case 'binary':
                      return latin1Slice(this, start, end);
    
                    case 'base64':
                      return base64Slice(this, start, end);
    
                    case 'ucs2':
                    case 'ucs-2':
                    case 'utf16le':
                    case 'utf-16le':
                      return utf16leSlice(this, start, end);
    
                    default:
                      if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
                      encoding = (encoding + '').toLowerCase();
                      loweredCase = true;
                  }
                }
              } // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
              // to detect a Buffer instance. It's not possible to use `instanceof Buffer`
              // reliably in a browserify context because there could be multiple different
              // copies of the 'buffer' package in use. This method works even for Buffer
              // instances that were created from another copy of the `buffer` package.
              // See: https://github.com/feross/buffer/issues/154
    
    
              Buffer.prototype._isBuffer = true;
    
              function swap(b, n, m) {
                var i = b[n];
                b[n] = b[m];
                b[m] = i;
              }
    
              Buffer.prototype.swap16 = function swap16() {
                var len = this.length;
    
                if (len % 2 !== 0) {
                  throw new RangeError('Buffer size must be a multiple of 16-bits');
                }
    
                for (var i = 0; i < len; i += 2) {
                  swap(this, i, i + 1);
                }
    
                return this;
              };
    
              Buffer.prototype.swap32 = function swap32() {
                var len = this.length;
    
                if (len % 4 !== 0) {
                  throw new RangeError('Buffer size must be a multiple of 32-bits');
                }
    
                for (var i = 0; i < len; i += 4) {
                  swap(this, i, i + 3);
                  swap(this, i + 1, i + 2);
                }
    
                return this;
              };
    
              Buffer.prototype.swap64 = function swap64() {
                var len = this.length;
    
                if (len % 8 !== 0) {
                  throw new RangeError('Buffer size must be a multiple of 64-bits');
                }
    
                for (var i = 0; i < len; i += 8) {
                  swap(this, i, i + 7);
                  swap(this, i + 1, i + 6);
                  swap(this, i + 2, i + 5);
                  swap(this, i + 3, i + 4);
                }
    
                return this;
              };
    
              Buffer.prototype.toString = function toString() {
                var length = this.length;
                if (length === 0) return '';
                if (arguments.length === 0) return utf8Slice(this, 0, length);
                return slowToString.apply(this, arguments);
              };
    
              Buffer.prototype.toLocaleString = Buffer.prototype.toString;
    
              Buffer.prototype.equals = function equals(b) {
                if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
                if (this === b) return true;
                return Buffer.compare(this, b) === 0;
              };
    
              Buffer.prototype.inspect = function inspect() {
                var str = '';
                var max = exports.INSPECT_MAX_BYTES;
                str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim();
                if (this.length > max) str += ' ... ';
                return '<Buffer ' + str + '>';
              };
    
              Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
                if (isInstance(target, Uint8Array)) {
                  target = Buffer.from(target, target.offset, target.byteLength);
                }
    
                if (!Buffer.isBuffer(target)) {
                  throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. ' + 'Received type ' + typeof target);
                }
    
                if (start === undefined) {
                  start = 0;
                }
    
                if (end === undefined) {
                  end = target ? target.length : 0;
                }
    
                if (thisStart === undefined) {
                  thisStart = 0;
                }
    
                if (thisEnd === undefined) {
                  thisEnd = this.length;
                }
    
                if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
                  throw new RangeError('out of range index');
                }
    
                if (thisStart >= thisEnd && start >= end) {
                  return 0;
                }
    
                if (thisStart >= thisEnd) {
                  return -1;
                }
    
                if (start >= end) {
                  return 1;
                }
    
                start >>>= 0;
                end >>>= 0;
                thisStart >>>= 0;
                thisEnd >>>= 0;
                if (this === target) return 0;
                var x = thisEnd - thisStart;
                var y = end - start;
                var len = Math.min(x, y);
                var thisCopy = this.slice(thisStart, thisEnd);
                var targetCopy = target.slice(start, end);
    
                for (var i = 0; i < len; ++i) {
                  if (thisCopy[i] !== targetCopy[i]) {
                    x = thisCopy[i];
                    y = targetCopy[i];
                    break;
                  }
                }
    
                if (x < y) return -1;
                if (y < x) return 1;
                return 0;
              }; // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
              // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
              //
              // Arguments:
              // - buffer - a Buffer to search
              // - val - a string, Buffer, or number
              // - byteOffset - an index into `buffer`; will be clamped to an int32
              // - encoding - an optional encoding, relevant is val is a string
              // - dir - true for indexOf, false for lastIndexOf
    
    
              function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
                // Empty buffer means no match
                if (buffer.length === 0) return -1; // Normalize byteOffset
    
                if (typeof byteOffset === 'string') {
                  encoding = byteOffset;
                  byteOffset = 0;
                } else if (byteOffset > 0x7fffffff) {
                  byteOffset = 0x7fffffff;
                } else if (byteOffset < -0x80000000) {
                  byteOffset = -0x80000000;
                }
    
                byteOffset = +byteOffset; // Coerce to Number.
    
                if (numberIsNaN(byteOffset)) {
                  // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
                  byteOffset = dir ? 0 : buffer.length - 1;
                } // Normalize byteOffset: negative offsets start from the end of the buffer
    
    
                if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
    
                if (byteOffset >= buffer.length) {
                  if (dir) return -1;else byteOffset = buffer.length - 1;
                } else if (byteOffset < 0) {
                  if (dir) byteOffset = 0;else return -1;
                } // Normalize val
    
    
                if (typeof val === 'string') {
                  val = Buffer.from(val, encoding);
                } // Finally, search either indexOf (if dir is true) or lastIndexOf
    
    
                if (Buffer.isBuffer(val)) {
                  // Special case: looking for empty string/buffer always fails
                  if (val.length === 0) {
                    return -1;
                  }
    
                  return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
                } else if (typeof val === 'number') {
                  val = val & 0xFF; // Search for a byte value [0-255]
    
                  if (typeof Uint8Array.prototype.indexOf === 'function') {
                    if (dir) {
                      return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
                    } else {
                      return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
                    }
                  }
    
                  return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
                }
    
                throw new TypeError('val must be string, number or Buffer');
              }
    
              function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
                var indexSize = 1;
                var arrLength = arr.length;
                var valLength = val.length;
    
                if (encoding !== undefined) {
                  encoding = String(encoding).toLowerCase();
    
                  if (encoding === 'ucs2' || encoding === 'ucs-2' || encoding === 'utf16le' || encoding === 'utf-16le') {
                    if (arr.length < 2 || val.length < 2) {
                      return -1;
                    }
    
                    indexSize = 2;
                    arrLength /= 2;
                    valLength /= 2;
                    byteOffset /= 2;
                  }
                }
    
                function read(buf, i) {
                  if (indexSize === 1) {
                    return buf[i];
                  } else {
                    return buf.readUInt16BE(i * indexSize);
                  }
                }
    
                var i;
    
                if (dir) {
                  var foundIndex = -1;
    
                  for (i = byteOffset; i < arrLength; i++) {
                    if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
                      if (foundIndex === -1) foundIndex = i;
                      if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
                    } else {
                      if (foundIndex !== -1) i -= i - foundIndex;
                      foundIndex = -1;
                    }
                  }
                } else {
                  if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
    
                  for (i = byteOffset; i >= 0; i--) {
                    var found = true;
    
                    for (var j = 0; j < valLength; j++) {
                      if (read(arr, i + j) !== read(val, j)) {
                        found = false;
                        break;
                      }
                    }
    
                    if (found) return i;
                  }
                }
    
                return -1;
              }
    
              Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
                return this.indexOf(val, byteOffset, encoding) !== -1;
              };
    
              Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
                return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
              };
    
              Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
                return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
              };
    
              function hexWrite(buf, string, offset, length) {
                offset = Number(offset) || 0;
                var remaining = buf.length - offset;
    
                if (!length) {
                  length = remaining;
                } else {
                  length = Number(length);
    
                  if (length > remaining) {
                    length = remaining;
                  }
                }
    
                var strLen = string.length;
    
                if (length > strLen / 2) {
                  length = strLen / 2;
                }
    
                for (var i = 0; i < length; ++i) {
                  var parsed = parseInt(string.substr(i * 2, 2), 16);
                  if (numberIsNaN(parsed)) return i;
                  buf[offset + i] = parsed;
                }
    
                return i;
              }
    
              function utf8Write(buf, string, offset, length) {
                return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
              }
    
              function asciiWrite(buf, string, offset, length) {
                return blitBuffer(asciiToBytes(string), buf, offset, length);
              }
    
              function latin1Write(buf, string, offset, length) {
                return asciiWrite(buf, string, offset, length);
              }
    
              function base64Write(buf, string, offset, length) {
                return blitBuffer(base64ToBytes(string), buf, offset, length);
              }
    
              function ucs2Write(buf, string, offset, length) {
                return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
              }
    
              Buffer.prototype.write = function write(string, offset, length, encoding) {
                // Buffer#write(string)
                if (offset === undefined) {
                  encoding = 'utf8';
                  length = this.length;
                  offset = 0; // Buffer#write(string, encoding)
                } else if (length === undefined && typeof offset === 'string') {
                  encoding = offset;
                  length = this.length;
                  offset = 0; // Buffer#write(string, offset[, length][, encoding])
                } else if (isFinite(offset)) {
                  offset = offset >>> 0;
    
                  if (isFinite(length)) {
                    length = length >>> 0;
                    if (encoding === undefined) encoding = 'utf8';
                  } else {
                    encoding = length;
                    length = undefined;
                  }
                } else {
                  throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');
                }
    
                var remaining = this.length - offset;
                if (length === undefined || length > remaining) length = remaining;
    
                if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
                  throw new RangeError('Attempt to write outside buffer bounds');
                }
    
                if (!encoding) encoding = 'utf8';
                var loweredCase = false;
    
                for (;;) {
                  switch (encoding) {
                    case 'hex':
                      return hexWrite(this, string, offset, length);
    
                    case 'utf8':
                    case 'utf-8':
                      return utf8Write(this, string, offset, length);
    
                    case 'ascii':
                      return asciiWrite(this, string, offset, length);
    
                    case 'latin1':
                    case 'binary':
                      return latin1Write(this, string, offset, length);
    
                    case 'base64':
                      // Warning: maxLength not taken into account in base64Write
                      return base64Write(this, string, offset, length);
    
                    case 'ucs2':
                    case 'ucs-2':
                    case 'utf16le':
                    case 'utf-16le':
                      return ucs2Write(this, string, offset, length);
    
                    default:
                      if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
                      encoding = ('' + encoding).toLowerCase();
                      loweredCase = true;
                  }
                }
              };
    
              Buffer.prototype.toJSON = function toJSON() {
                return {
                  type: 'Buffer',
                  data: Array.prototype.slice.call(this._arr || this, 0)
                };
              };
    
              function base64Slice(buf, start, end) {
                if (start === 0 && end === buf.length) {
                  return base64.fromByteArray(buf);
                } else {
                  return base64.fromByteArray(buf.slice(start, end));
                }
              }
    
              function utf8Slice(buf, start, end) {
                end = Math.min(buf.length, end);
                var res = [];
                var i = start;
    
                while (i < end) {
                  var firstByte = buf[i];
                  var codePoint = null;
                  var bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;
    
                  if (i + bytesPerSequence <= end) {
                    var secondByte, thirdByte, fourthByte, tempCodePoint;
    
                    switch (bytesPerSequence) {
                      case 1:
                        if (firstByte < 0x80) {
                          codePoint = firstByte;
                        }
    
                        break;
    
                      case 2:
                        secondByte = buf[i + 1];
    
                        if ((secondByte & 0xC0) === 0x80) {
                          tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;
    
                          if (tempCodePoint > 0x7F) {
                            codePoint = tempCodePoint;
                          }
                        }
    
                        break;
    
                      case 3:
                        secondByte = buf[i + 1];
                        thirdByte = buf[i + 2];
    
                        if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                          tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;
    
                          if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                            codePoint = tempCodePoint;
                          }
                        }
    
                        break;
    
                      case 4:
                        secondByte = buf[i + 1];
                        thirdByte = buf[i + 2];
                        fourthByte = buf[i + 3];
    
                        if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                          tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;
    
                          if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                            codePoint = tempCodePoint;
                          }
                        }
    
                    }
                  }
    
                  if (codePoint === null) {
                    // we did not generate a valid codePoint so insert a
                    // replacement char (U+FFFD) and advance only 1 byte
                    codePoint = 0xFFFD;
                    bytesPerSequence = 1;
                  } else if (codePoint > 0xFFFF) {
                    // encode to utf16 (surrogate pair dance)
                    codePoint -= 0x10000;
                    res.push(codePoint >>> 10 & 0x3FF | 0xD800);
                    codePoint = 0xDC00 | codePoint & 0x3FF;
                  }
    
                  res.push(codePoint);
                  i += bytesPerSequence;
                }
    
                return decodeCodePointsArray(res);
              } // Based on http://stackoverflow.com/a/22747272/680742, the browser with
              // the lowest limit is Chrome, with 0x10000 args.
              // We go 1 magnitude less, for safety
    
    
              var MAX_ARGUMENTS_LENGTH = 0x1000;
    
              function decodeCodePointsArray(codePoints) {
                var len = codePoints.length;
    
                if (len <= MAX_ARGUMENTS_LENGTH) {
                  return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
                } // Decode in chunks to avoid "call stack size exceeded".
    
    
                var res = '';
                var i = 0;
    
                while (i < len) {
                  res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
                }
    
                return res;
              }
    
              function asciiSlice(buf, start, end) {
                var ret = '';
                end = Math.min(buf.length, end);
    
                for (var i = start; i < end; ++i) {
                  ret += String.fromCharCode(buf[i] & 0x7F);
                }
    
                return ret;
              }
    
              function latin1Slice(buf, start, end) {
                var ret = '';
                end = Math.min(buf.length, end);
    
                for (var i = start; i < end; ++i) {
                  ret += String.fromCharCode(buf[i]);
                }
    
                return ret;
              }
    
              function hexSlice(buf, start, end) {
                var len = buf.length;
                if (!start || start < 0) start = 0;
                if (!end || end < 0 || end > len) end = len;
                var out = '';
    
                for (var i = start; i < end; ++i) {
                  out += toHex(buf[i]);
                }
    
                return out;
              }
    
              function utf16leSlice(buf, start, end) {
                var bytes = buf.slice(start, end);
                var res = '';
    
                for (var i = 0; i < bytes.length; i += 2) {
                  res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
                }
    
                return res;
              }
    
              Buffer.prototype.slice = function slice(start, end) {
                var len = this.length;
                start = ~~start;
                end = end === undefined ? len : ~~end;
    
                if (start < 0) {
                  start += len;
                  if (start < 0) start = 0;
                } else if (start > len) {
                  start = len;
                }
    
                if (end < 0) {
                  end += len;
                  if (end < 0) end = 0;
                } else if (end > len) {
                  end = len;
                }
    
                if (end < start) end = start;
                var newBuf = this.subarray(start, end); // Return an augmented `Uint8Array` instance
    
                newBuf.__proto__ = Buffer.prototype;
                return newBuf;
              };
              /*
               * Need to make sure that buffer isn't trying to write out of bounds.
               */
    
    
              function checkOffset(offset, ext, length) {
                if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
                if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
              }
    
              Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
                offset = offset >>> 0;
                byteLength = byteLength >>> 0;
                if (!noAssert) checkOffset(offset, byteLength, this.length);
                var val = this[offset];
                var mul = 1;
                var i = 0;
    
                while (++i < byteLength && (mul *= 0x100)) {
                  val += this[offset + i] * mul;
                }
    
                return val;
              };
    
              Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
                offset = offset >>> 0;
                byteLength = byteLength >>> 0;
    
                if (!noAssert) {
                  checkOffset(offset, byteLength, this.length);
                }
    
                var val = this[offset + --byteLength];
                var mul = 1;
    
                while (byteLength > 0 && (mul *= 0x100)) {
                  val += this[offset + --byteLength] * mul;
                }
    
                return val;
              };
    
              Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
                offset = offset >>> 0;
                if (!noAssert) checkOffset(offset, 1, this.length);
                return this[offset];
              };
    
              Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
                offset = offset >>> 0;
                if (!noAssert) checkOffset(offset, 2, this.length);
                return this[offset] | this[offset + 1] << 8;
              };
    
              Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
                offset = offset >>> 0;
                if (!noAssert) checkOffset(offset, 2, this.length);
                return this[offset] << 8 | this[offset + 1];
              };
    
              Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
                offset = offset >>> 0;
                if (!noAssert) checkOffset(offset, 4, this.length);
                return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 0x1000000;
              };
    
              Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
                offset = offset >>> 0;
                if (!noAssert) checkOffset(offset, 4, this.length);
                return this[offset] * 0x1000000 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
              };
    
              Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
                offset = offset >>> 0;
                byteLength = byteLength >>> 0;
                if (!noAssert) checkOffset(offset, byteLength, this.length);
                var val = this[offset];
                var mul = 1;
                var i = 0;
    
                while (++i < byteLength && (mul *= 0x100)) {
                  val += this[offset + i] * mul;
                }
    
                mul *= 0x80;
                if (val >= mul) val -= Math.pow(2, 8 * byteLength);
                return val;
              };
    
              Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
                offset = offset >>> 0;
                byteLength = byteLength >>> 0;
                if (!noAssert) checkOffset(offset, byteLength, this.length);
                var i = byteLength;
                var mul = 1;
                var val = this[offset + --i];
    
                while (i > 0 && (mul *= 0x100)) {
                  val += this[offset + --i] * mul;
                }
    
                mul *= 0x80;
                if (val >= mul) val -= Math.pow(2, 8 * byteLength);
                return val;
              };
    
              Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
                offset = offset >>> 0;
                if (!noAssert) checkOffset(offset, 1, this.length);
                if (!(this[offset] & 0x80)) return this[offset];
                return (0xff - this[offset] + 1) * -1;
              };
    
              Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
                offset = offset >>> 0;
                if (!noAssert) checkOffset(offset, 2, this.length);
                var val = this[offset] | this[offset + 1] << 8;
                return val & 0x8000 ? val | 0xFFFF0000 : val;
              };
    
              Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
                offset = offset >>> 0;
                if (!noAssert) checkOffset(offset, 2, this.length);
                var val = this[offset + 1] | this[offset] << 8;
                return val & 0x8000 ? val | 0xFFFF0000 : val;
              };
    
              Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
                offset = offset >>> 0;
                if (!noAssert) checkOffset(offset, 4, this.length);
                return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
              };
    
              Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
                offset = offset >>> 0;
                if (!noAssert) checkOffset(offset, 4, this.length);
                return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
              };
    
              Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
                offset = offset >>> 0;
                if (!noAssert) checkOffset(offset, 4, this.length);
                return ieee754.read(this, offset, true, 23, 4);
              };
    
              Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
                offset = offset >>> 0;
                if (!noAssert) checkOffset(offset, 4, this.length);
                return ieee754.read(this, offset, false, 23, 4);
              };
    
              Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
                offset = offset >>> 0;
                if (!noAssert) checkOffset(offset, 8, this.length);
                return ieee754.read(this, offset, true, 52, 8);
              };
    
              Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
                offset = offset >>> 0;
                if (!noAssert) checkOffset(offset, 8, this.length);
                return ieee754.read(this, offset, false, 52, 8);
              };
    
              function checkInt(buf, value, offset, ext, max, min) {
                if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
                if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
                if (offset + ext > buf.length) throw new RangeError('Index out of range');
              }
    
              Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
                value = +value;
                offset = offset >>> 0;
                byteLength = byteLength >>> 0;
    
                if (!noAssert) {
                  var maxBytes = Math.pow(2, 8 * byteLength) - 1;
                  checkInt(this, value, offset, byteLength, maxBytes, 0);
                }
    
                var mul = 1;
                var i = 0;
                this[offset] = value & 0xFF;
    
                while (++i < byteLength && (mul *= 0x100)) {
                  this[offset + i] = value / mul & 0xFF;
                }
    
                return offset + byteLength;
              };
    
              Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
                value = +value;
                offset = offset >>> 0;
                byteLength = byteLength >>> 0;
    
                if (!noAssert) {
                  var maxBytes = Math.pow(2, 8 * byteLength) - 1;
                  checkInt(this, value, offset, byteLength, maxBytes, 0);
                }
    
                var i = byteLength - 1;
                var mul = 1;
                this[offset + i] = value & 0xFF;
    
                while (--i >= 0 && (mul *= 0x100)) {
                  this[offset + i] = value / mul & 0xFF;
                }
    
                return offset + byteLength;
              };
    
              Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
                value = +value;
                offset = offset >>> 0;
                if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
                this[offset] = value & 0xff;
                return offset + 1;
              };
    
              Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
                value = +value;
                offset = offset >>> 0;
                if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
                this[offset] = value & 0xff;
                this[offset + 1] = value >>> 8;
                return offset + 2;
              };
    
              Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
                value = +value;
                offset = offset >>> 0;
                if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
                this[offset] = value >>> 8;
                this[offset + 1] = value & 0xff;
                return offset + 2;
              };
    
              Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
                value = +value;
                offset = offset >>> 0;
                if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
                this[offset + 3] = value >>> 24;
                this[offset + 2] = value >>> 16;
                this[offset + 1] = value >>> 8;
                this[offset] = value & 0xff;
                return offset + 4;
              };
    
              Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
                value = +value;
                offset = offset >>> 0;
                if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
                this[offset] = value >>> 24;
                this[offset + 1] = value >>> 16;
                this[offset + 2] = value >>> 8;
                this[offset + 3] = value & 0xff;
                return offset + 4;
              };
    
              Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
                value = +value;
                offset = offset >>> 0;
    
                if (!noAssert) {
                  var limit = Math.pow(2, 8 * byteLength - 1);
                  checkInt(this, value, offset, byteLength, limit - 1, -limit);
                }
    
                var i = 0;
                var mul = 1;
                var sub = 0;
                this[offset] = value & 0xFF;
    
                while (++i < byteLength && (mul *= 0x100)) {
                  if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
                    sub = 1;
                  }
    
                  this[offset + i] = (value / mul >> 0) - sub & 0xFF;
                }
    
                return offset + byteLength;
              };
    
              Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
                value = +value;
                offset = offset >>> 0;
    
                if (!noAssert) {
                  var limit = Math.pow(2, 8 * byteLength - 1);
                  checkInt(this, value, offset, byteLength, limit - 1, -limit);
                }
    
                var i = byteLength - 1;
                var mul = 1;
                var sub = 0;
                this[offset + i] = value & 0xFF;
    
                while (--i >= 0 && (mul *= 0x100)) {
                  if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
                    sub = 1;
                  }
    
                  this[offset + i] = (value / mul >> 0) - sub & 0xFF;
                }
    
                return offset + byteLength;
              };
    
              Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
                value = +value;
                offset = offset >>> 0;
                if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
                if (value < 0) value = 0xff + value + 1;
                this[offset] = value & 0xff;
                return offset + 1;
              };
    
              Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
                value = +value;
                offset = offset >>> 0;
                if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
                this[offset] = value & 0xff;
                this[offset + 1] = value >>> 8;
                return offset + 2;
              };
    
              Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
                value = +value;
                offset = offset >>> 0;
                if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
                this[offset] = value >>> 8;
                this[offset + 1] = value & 0xff;
                return offset + 2;
              };
    
              Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
                value = +value;
                offset = offset >>> 0;
                if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
                this[offset] = value & 0xff;
                this[offset + 1] = value >>> 8;
                this[offset + 2] = value >>> 16;
                this[offset + 3] = value >>> 24;
                return offset + 4;
              };
    
              Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
                value = +value;
                offset = offset >>> 0;
                if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
                if (value < 0) value = 0xffffffff + value + 1;
                this[offset] = value >>> 24;
                this[offset + 1] = value >>> 16;
                this[offset + 2] = value >>> 8;
                this[offset + 3] = value & 0xff;
                return offset + 4;
              };
    
              function checkIEEE754(buf, value, offset, ext, max, min) {
                if (offset + ext > buf.length) throw new RangeError('Index out of range');
                if (offset < 0) throw new RangeError('Index out of range');
              }
    
              function writeFloat(buf, value, offset, littleEndian, noAssert) {
                value = +value;
                offset = offset >>> 0;
    
                if (!noAssert) {
                  checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
                }
    
                ieee754.write(buf, value, offset, littleEndian, 23, 4);
                return offset + 4;
              }
    
              Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
                return writeFloat(this, value, offset, true, noAssert);
              };
    
              Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
                return writeFloat(this, value, offset, false, noAssert);
              };
    
              function writeDouble(buf, value, offset, littleEndian, noAssert) {
                value = +value;
                offset = offset >>> 0;
    
                if (!noAssert) {
                  checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
                }
    
                ieee754.write(buf, value, offset, littleEndian, 52, 8);
                return offset + 8;
              }
    
              Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
                return writeDouble(this, value, offset, true, noAssert);
              };
    
              Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
                return writeDouble(this, value, offset, false, noAssert);
              }; // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
    
    
              Buffer.prototype.copy = function copy(target, targetStart, start, end) {
                if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer');
                if (!start) start = 0;
                if (!end && end !== 0) end = this.length;
                if (targetStart >= target.length) targetStart = target.length;
                if (!targetStart) targetStart = 0;
                if (end > 0 && end < start) end = start; // Copy 0 bytes; we're done
    
                if (end === start) return 0;
                if (target.length === 0 || this.length === 0) return 0; // Fatal error conditions
    
                if (targetStart < 0) {
                  throw new RangeError('targetStart out of bounds');
                }
    
                if (start < 0 || start >= this.length) throw new RangeError('Index out of range');
                if (end < 0) throw new RangeError('sourceEnd out of bounds'); // Are we oob?
    
                if (end > this.length) end = this.length;
    
                if (target.length - targetStart < end - start) {
                  end = target.length - targetStart + start;
                }
    
                var len = end - start;
    
                if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
                  // Use built-in when available, missing from IE11
                  this.copyWithin(targetStart, start, end);
                } else if (this === target && start < targetStart && targetStart < end) {
                  // descending copy from end
                  for (var i = len - 1; i >= 0; --i) {
                    target[i + targetStart] = this[i + start];
                  }
                } else {
                  Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
                }
    
                return len;
              }; // Usage:
              //    buffer.fill(number[, offset[, end]])
              //    buffer.fill(buffer[, offset[, end]])
              //    buffer.fill(string[, offset[, end]][, encoding])
    
    
              Buffer.prototype.fill = function fill(val, start, end, encoding) {
                // Handle string cases:
                if (typeof val === 'string') {
                  if (typeof start === 'string') {
                    encoding = start;
                    start = 0;
                    end = this.length;
                  } else if (typeof end === 'string') {
                    encoding = end;
                    end = this.length;
                  }
    
                  if (encoding !== undefined && typeof encoding !== 'string') {
                    throw new TypeError('encoding must be a string');
                  }
    
                  if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
                    throw new TypeError('Unknown encoding: ' + encoding);
                  }
    
                  if (val.length === 1) {
                    var code = val.charCodeAt(0);
    
                    if (encoding === 'utf8' && code < 128 || encoding === 'latin1') {
                      // Fast path: If `val` fits into a single byte, use that numeric value.
                      val = code;
                    }
                  }
                } else if (typeof val === 'number') {
                  val = val & 255;
                } // Invalid ranges are not set to a default, so can range check early.
    
    
                if (start < 0 || this.length < start || this.length < end) {
                  throw new RangeError('Out of range index');
                }
    
                if (end <= start) {
                  return this;
                }
    
                start = start >>> 0;
                end = end === undefined ? this.length : end >>> 0;
                if (!val) val = 0;
                var i;
    
                if (typeof val === 'number') {
                  for (i = start; i < end; ++i) {
                    this[i] = val;
                  }
                } else {
                  var bytes = Buffer.isBuffer(val) ? val : Buffer.from(val, encoding);
                  var len = bytes.length;
    
                  if (len === 0) {
                    throw new TypeError('The value "' + val + '" is invalid for argument "value"');
                  }
    
                  for (i = 0; i < end - start; ++i) {
                    this[i + start] = bytes[i % len];
                  }
                }
    
                return this;
              }; // HELPER FUNCTIONS
              // ================
    
    
              var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
    
              function base64clean(str) {
                // Node takes equal signs as end of the Base64 encoding
                str = str.split('=')[0]; // Node strips out invalid characters like \n and \t from the string, base64-js does not
    
                str = str.trim().replace(INVALID_BASE64_RE, ''); // Node converts strings with length < 2 to ''
    
                if (str.length < 2) return ''; // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
    
                while (str.length % 4 !== 0) {
                  str = str + '=';
                }
    
                return str;
              }
    
              function toHex(n) {
                if (n < 16) return '0' + n.toString(16);
                return n.toString(16);
              }
    
              function utf8ToBytes(string, units) {
                units = units || Infinity;
                var codePoint;
                var length = string.length;
                var leadSurrogate = null;
                var bytes = [];
    
                for (var i = 0; i < length; ++i) {
                  codePoint = string.charCodeAt(i); // is surrogate component
    
                  if (codePoint > 0xD7FF && codePoint < 0xE000) {
                    // last char was a lead
                    if (!leadSurrogate) {
                      // no lead yet
                      if (codePoint > 0xDBFF) {
                        // unexpected trail
                        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                        continue;
                      } else if (i + 1 === length) {
                        // unpaired lead
                        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                        continue;
                      } // valid lead
    
    
                      leadSurrogate = codePoint;
                      continue;
                    } // 2 leads in a row
    
    
                    if (codePoint < 0xDC00) {
                      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                      leadSurrogate = codePoint;
                      continue;
                    } // valid surrogate pair
    
    
                    codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
                  } else if (leadSurrogate) {
                    // valid bmp char, but last char was a lead
                    if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                  }
    
                  leadSurrogate = null; // encode utf8
    
                  if (codePoint < 0x80) {
                    if ((units -= 1) < 0) break;
                    bytes.push(codePoint);
                  } else if (codePoint < 0x800) {
                    if ((units -= 2) < 0) break;
                    bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
                  } else if (codePoint < 0x10000) {
                    if ((units -= 3) < 0) break;
                    bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
                  } else if (codePoint < 0x110000) {
                    if ((units -= 4) < 0) break;
                    bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
                  } else {
                    throw new Error('Invalid code point');
                  }
                }
    
                return bytes;
              }
    
              function asciiToBytes(str) {
                var byteArray = [];
    
                for (var i = 0; i < str.length; ++i) {
                  // Node's code seems to be doing this and not & 0x7F..
                  byteArray.push(str.charCodeAt(i) & 0xFF);
                }
    
                return byteArray;
              }
    
              function utf16leToBytes(str, units) {
                var c, hi, lo;
                var byteArray = [];
    
                for (var i = 0; i < str.length; ++i) {
                  if ((units -= 2) < 0) break;
                  c = str.charCodeAt(i);
                  hi = c >> 8;
                  lo = c % 256;
                  byteArray.push(lo);
                  byteArray.push(hi);
                }
    
                return byteArray;
              }
    
              function base64ToBytes(str) {
                return base64.toByteArray(base64clean(str));
              }
    
              function blitBuffer(src, dst, offset, length) {
                for (var i = 0; i < length; ++i) {
                  if (i + offset >= dst.length || i >= src.length) break;
                  dst[i + offset] = src[i];
                }
    
                return i;
              } // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
              // the `instanceof` check but they should be treated as of that type.
              // See: https://github.com/feross/buffer/issues/166
    
    
              function isInstance(obj, type) {
                return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
              }
    
              function numberIsNaN(obj) {
                // For IE11 support
                return obj !== obj; // eslint-disable-line no-self-compare
              }
            }).call(this);
          }).call(this, require("buffer").Buffer);
        }, {
          "base64-js": 10,
          "buffer": 12,
          "ieee754": 18
        }],
        13: [function (require, module, exports) {
          (function (Buffer) {
            (function () {
              // Copyright Joyent, Inc. and other Node contributors.
              //
              // Permission is hereby granted, free of charge, to any person obtaining a
              // copy of this software and associated documentation files (the
              // "Software"), to deal in the Software without restriction, including
              // without limitation the rights to use, copy, modify, merge, publish,
              // distribute, sublicense, and/or sell copies of the Software, and to permit
              // persons to whom the Software is furnished to do so, subject to the
              // following conditions:
              //
              // The above copyright notice and this permission notice shall be included
              // in all copies or substantial portions of the Software.
              //
              // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
              // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
              // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
              // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
              // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
              // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
              // USE OR OTHER DEALINGS IN THE SOFTWARE.
              // NOTE: These type checking functions intentionally don't use `instanceof`
              // because it is fragile and can be easily faked with `Object.create()`.
              function isArray(arg) {
                if (Array.isArray) {
                  return Array.isArray(arg);
                }
    
                return objectToString(arg) === '[object Array]';
              }
    
              exports.isArray = isArray;
    
              function isBoolean(arg) {
                return typeof arg === 'boolean';
              }
    
              exports.isBoolean = isBoolean;
    
              function isNull(arg) {
                return arg === null;
              }
    
              exports.isNull = isNull;
    
              function isNullOrUndefined(arg) {
                return arg == null;
              }
    
              exports.isNullOrUndefined = isNullOrUndefined;
    
              function isNumber(arg) {
                return typeof arg === 'number';
              }
    
              exports.isNumber = isNumber;
    
              function isString(arg) {
                return typeof arg === 'string';
              }
    
              exports.isString = isString;
    
              function isSymbol(arg) {
                return typeof arg === 'symbol';
              }
    
              exports.isSymbol = isSymbol;
    
              function isUndefined(arg) {
                return arg === void 0;
              }
    
              exports.isUndefined = isUndefined;
    
              function isRegExp(re) {
                return objectToString(re) === '[object RegExp]';
              }
    
              exports.isRegExp = isRegExp;
    
              function isObject(arg) {
                return typeof arg === 'object' && arg !== null;
              }
    
              exports.isObject = isObject;
    
              function isDate(d) {
                return objectToString(d) === '[object Date]';
              }
    
              exports.isDate = isDate;
    
              function isError(e) {
                return objectToString(e) === '[object Error]' || e instanceof Error;
              }
    
              exports.isError = isError;
    
              function isFunction(arg) {
                return typeof arg === 'function';
              }
    
              exports.isFunction = isFunction;
    
              function isPrimitive(arg) {
                return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || typeof arg === 'symbol' || // ES6 symbol
                typeof arg === 'undefined';
              }
    
              exports.isPrimitive = isPrimitive;
              exports.isBuffer = Buffer.isBuffer;
    
              function objectToString(o) {
                return Object.prototype.toString.call(o);
              }
            }).call(this);
          }).call(this, {
            "isBuffer": require("../../is-buffer/index.js")
          });
        }, {
          "../../is-buffer/index.js": 20
        }],
        14: [function (require, module, exports) {
          (function (process) {
            (function () {
              /* eslint-env browser */
    
              /**
               * This is the web browser implementation of `debug()`.
               */
              exports.formatArgs = formatArgs;
              exports.save = save;
              exports.load = load;
              exports.useColors = useColors;
              exports.storage = localstorage();
    
              exports.destroy = (() => {
                let warned = false;
                return () => {
                  if (!warned) {
                    warned = true;
                    console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
                  }
                };
              })();
              /**
               * Colors.
               */
    
    
              exports.colors = ['#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF', '#0099CC', '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF', '#3300CC', '#3300FF', '#3333CC', '#3333FF', '#3366CC', '#3366FF', '#3399CC', '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF', '#6600CC', '#6600FF', '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC', '#9900FF', '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033', '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366', '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC9900', '#CC9933', '#CCCC00', '#CCCC33', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC', '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF', '#FF6600', '#FF6633', '#FF9900', '#FF9933', '#FFCC00', '#FFCC33'];
              /**
               * Currently only WebKit-based Web Inspectors, Firefox >= v31,
               * and the Firebug extension (any Firefox version) are known
               * to support "%c" CSS customizations.
               *
               * TODO: add a `localStorage` variable to explicitly enable/disable colors
               */
              // eslint-disable-next-line complexity
    
              function useColors() {
                // NB: In an Electron preload script, document will be defined but not fully
                // initialized. Since we know we're in Chrome, we'll just detect this case
                // explicitly
                if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
                  return true;
                } // Internet Explorer and Edge do not support colors.
    
    
                if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
                  return false;
                } // Is webkit? http://stackoverflow.com/a/16459606/376773
                // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
    
    
                return typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
                typeof window !== 'undefined' && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
                // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
                typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
                typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
              }
              /**
               * Colorize log arguments if enabled.
               *
               * @api public
               */
    
    
              function formatArgs(args) {
                args[0] = (this.useColors ? '%c' : '') + this.namespace + (this.useColors ? ' %c' : ' ') + args[0] + (this.useColors ? '%c ' : ' ') + '+' + module.exports.humanize(this.diff);
    
                if (!this.useColors) {
                  return;
                }
    
                const c = 'color: ' + this.color;
                args.splice(1, 0, c, 'color: inherit'); // The final "%c" is somewhat tricky, because there could be other
                // arguments passed either before or after the %c, so we need to
                // figure out the correct index to insert the CSS into
    
                let index = 0;
                let lastC = 0;
                args[0].replace(/%[a-zA-Z%]/g, match => {
                  if (match === '%%') {
                    return;
                  }
    
                  index++;
    
                  if (match === '%c') {
                    // We only are interested in the *last* %c
                    // (the user may have provided their own)
                    lastC = index;
                  }
                });
                args.splice(lastC, 0, c);
              }
              /**
               * Invokes `console.debug()` when available.
               * No-op when `console.debug` is not a "function".
               * If `console.debug` is not available, falls back
               * to `console.log`.
               *
               * @api public
               */
    
    
              exports.log = console.debug || console.log || (() => {});
              /**
               * Save `namespaces`.
               *
               * @param {String} namespaces
               * @api private
               */
    
    
              function save(namespaces) {
                try {
                  if (namespaces) {
                    exports.storage.setItem('debug', namespaces);
                  } else {
                    exports.storage.removeItem('debug');
                  }
                } catch (error) {// Swallow
                  // XXX (@Qix-) should we be logging these?
                }
              }
              /**
               * Load `namespaces`.
               *
               * @return {String} returns the previously persisted debug modes
               * @api private
               */
    
    
              function load() {
                let r;
    
                try {
                  r = exports.storage.getItem('debug');
                } catch (error) {// Swallow
                  // XXX (@Qix-) should we be logging these?
                } // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
    
    
                if (!r && typeof process !== 'undefined' && 'env' in process) {
                  r = process.env.DEBUG;
                }
    
                return r;
              }
              /**
               * Localstorage attempts to return the localstorage.
               *
               * This is necessary because safari throws
               * when a user disables cookies/localstorage
               * and you attempt to access it.
               *
               * @return {LocalStorage}
               * @api private
               */
    
    
              function localstorage() {
                try {
                  // TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
                  // The Browser also has localStorage in the global context.
                  return localStorage;
                } catch (error) {// Swallow
                  // XXX (@Qix-) should we be logging these?
                }
              }
    
              module.exports = require('./common')(exports);
              const {
                formatters
              } = module.exports;
              /**
               * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
               */
    
              formatters.j = function (v) {
                try {
                  return JSON.stringify(v);
                } catch (error) {
                  return '[UnexpectedJSONParseError]: ' + error.message;
                }
              };
            }).call(this);
          }).call(this, require('_process'));
        }, {
          "./common": 15,
          "_process": 24
        }],
        15: [function (require, module, exports) {
          /**
           * This is the common logic for both the Node.js and web browser
           * implementations of `debug()`.
           */
          function setup(env) {
            createDebug.debug = createDebug;
            createDebug.default = createDebug;
            createDebug.coerce = coerce;
            createDebug.disable = disable;
            createDebug.enable = enable;
            createDebug.enabled = enabled;
            createDebug.humanize = require('ms');
            createDebug.destroy = destroy;
            Object.keys(env).forEach(key => {
              createDebug[key] = env[key];
            });
            /**
            * The currently active debug mode names, and names to skip.
            */
    
            createDebug.names = [];
            createDebug.skips = [];
            /**
            * Map of special "%n" handling functions, for the debug "format" argument.
            *
            * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
            */
    
            createDebug.formatters = {};
            /**
            * Selects a color for a debug namespace
            * @param {String} namespace The namespace string for the debug instance to be colored
            * @return {Number|String} An ANSI color code for the given namespace
            * @api private
            */
    
            function selectColor(namespace) {
              let hash = 0;
    
              for (let i = 0; i < namespace.length; i++) {
                hash = (hash << 5) - hash + namespace.charCodeAt(i);
                hash |= 0; // Convert to 32bit integer
              }
    
              return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
            }
    
            createDebug.selectColor = selectColor;
            /**
            * Create a debugger with the given `namespace`.
            *
            * @param {String} namespace
            * @return {Function}
            * @api public
            */
    
            function createDebug(namespace) {
              let prevTime;
              let enableOverride = null;
              let namespacesCache;
              let enabledCache;
    
              function debug(...args) {
                // Disabled?
                if (!debug.enabled) {
                  return;
                }
    
                const self = debug; // Set `diff` timestamp
    
                const curr = Number(new Date());
                const ms = curr - (prevTime || curr);
                self.diff = ms;
                self.prev = prevTime;
                self.curr = curr;
                prevTime = curr;
                args[0] = createDebug.coerce(args[0]);
    
                if (typeof args[0] !== 'string') {
                  // Anything else let's inspect with %O
                  args.unshift('%O');
                } // Apply any `formatters` transformations
    
    
                let index = 0;
                args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
                  // If we encounter an escaped % then don't increase the array index
                  if (match === '%%') {
                    return '%';
                  }
    
                  index++;
                  const formatter = createDebug.formatters[format];
    
                  if (typeof formatter === 'function') {
                    const val = args[index];
                    match = formatter.call(self, val); // Now we need to remove `args[index]` since it's inlined in the `format`
    
                    args.splice(index, 1);
                    index--;
                  }
    
                  return match;
                }); // Apply env-specific formatting (colors, etc.)
    
                createDebug.formatArgs.call(self, args);
                const logFn = self.log || createDebug.log;
                logFn.apply(self, args);
              }
    
              debug.namespace = namespace;
              debug.useColors = createDebug.useColors();
              debug.color = createDebug.selectColor(namespace);
              debug.extend = extend;
              debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.
    
              Object.defineProperty(debug, 'enabled', {
                enumerable: true,
                configurable: false,
                get: () => {
                  if (enableOverride !== null) {
                    return enableOverride;
                  }
    
                  if (namespacesCache !== createDebug.namespaces) {
                    namespacesCache = createDebug.namespaces;
                    enabledCache = createDebug.enabled(namespace);
                  }
    
                  return enabledCache;
                },
                set: v => {
                  enableOverride = v;
                }
              }); // Env-specific initialization logic for debug instances
    
              if (typeof createDebug.init === 'function') {
                createDebug.init(debug);
              }
    
              return debug;
            }
    
            function extend(namespace, delimiter) {
              const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
              newDebug.log = this.log;
              return newDebug;
            }
            /**
            * Enables a debug mode by namespaces. This can include modes
            * separated by a colon and wildcards.
            *
            * @param {String} namespaces
            * @api public
            */
    
    
            function enable(namespaces) {
              createDebug.save(namespaces);
              createDebug.namespaces = namespaces;
              createDebug.names = [];
              createDebug.skips = [];
              let i;
              const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
              const len = split.length;
    
              for (i = 0; i < len; i++) {
                if (!split[i]) {
                  // ignore empty strings
                  continue;
                }
    
                namespaces = split[i].replace(/\*/g, '.*?');
    
                if (namespaces[0] === '-') {
                  createDebug.skips.push(new RegExp('^' + namespaces.slice(1) + '$'));
                } else {
                  createDebug.names.push(new RegExp('^' + namespaces + '$'));
                }
              }
            }
            /**
            * Disable debug output.
            *
            * @return {String} namespaces
            * @api public
            */
    
    
            function disable() {
              const namespaces = [...createDebug.names.map(toNamespace), ...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)].join(',');
              createDebug.enable('');
              return namespaces;
            }
            /**
            * Returns true if the given mode name is enabled, false otherwise.
            *
            * @param {String} name
            * @return {Boolean}
            * @api public
            */
    
    
            function enabled(name) {
              if (name[name.length - 1] === '*') {
                return true;
              }
    
              let i;
              let len;
    
              for (i = 0, len = createDebug.skips.length; i < len; i++) {
                if (createDebug.skips[i].test(name)) {
                  return false;
                }
              }
    
              for (i = 0, len = createDebug.names.length; i < len; i++) {
                if (createDebug.names[i].test(name)) {
                  return true;
                }
              }
    
              return false;
            }
            /**
            * Convert regexp to namespace
            *
            * @param {RegExp} regxep
            * @return {String} namespace
            * @api private
            */
    
    
            function toNamespace(regexp) {
              return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, '*');
            }
            /**
            * Coerce `val`.
            *
            * @param {Mixed} val
            * @return {Mixed}
            * @api private
            */
    
    
            function coerce(val) {
              if (val instanceof Error) {
                return val.stack || val.message;
              }
    
              return val;
            }
            /**
            * XXX DO NOT USE. This is a temporary stub function.
            * XXX It WILL be removed in the next major release.
            */
    
    
            function destroy() {
              console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
            }
    
            createDebug.enable(createDebug.load());
            return createDebug;
          }
    
          module.exports = setup;
        }, {
          "ms": 22
        }],
        16: [function (require, module, exports) {
          // Copyright Joyent, Inc. and other Node contributors.
          //
          // Permission is hereby granted, free of charge, to any person obtaining a
          // copy of this software and associated documentation files (the
          // "Software"), to deal in the Software without restriction, including
          // without limitation the rights to use, copy, modify, merge, publish,
          // distribute, sublicense, and/or sell copies of the Software, and to permit
          // persons to whom the Software is furnished to do so, subject to the
          // following conditions:
          //
          // The above copyright notice and this permission notice shall be included
          // in all copies or substantial portions of the Software.
          //
          // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
          // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
          // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
          // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
          // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
          // USE OR OTHER DEALINGS IN THE SOFTWARE.
          'use strict';
    
          var R = typeof Reflect === 'object' ? Reflect : null;
          var ReflectApply = R && typeof R.apply === 'function' ? R.apply : function ReflectApply(target, receiver, args) {
            return Function.prototype.apply.call(target, receiver, args);
          };
          var ReflectOwnKeys;
    
          if (R && typeof R.ownKeys === 'function') {
            ReflectOwnKeys = R.ownKeys;
          } else if (Object.getOwnPropertySymbols) {
            ReflectOwnKeys = function ReflectOwnKeys(target) {
              return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
            };
          } else {
            ReflectOwnKeys = function ReflectOwnKeys(target) {
              return Object.getOwnPropertyNames(target);
            };
          }
    
          function ProcessEmitWarning(warning) {
            if (console && console.warn) console.warn(warning);
          }
    
          var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
            return value !== value;
          };
    
          function EventEmitter() {
            EventEmitter.init.call(this);
          }
    
          module.exports = EventEmitter;
          module.exports.once = once; // Backwards-compat with node 0.10.x
    
          EventEmitter.EventEmitter = EventEmitter;
          EventEmitter.prototype._events = undefined;
          EventEmitter.prototype._eventsCount = 0;
          EventEmitter.prototype._maxListeners = undefined; // By default EventEmitters will print a warning if more than 10 listeners are
          // added to it. This is a useful default which helps finding memory leaks.
    
          var defaultMaxListeners = 10;
    
          function checkListener(listener) {
            if (typeof listener !== 'function') {
              throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
            }
          }
    
          Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
            enumerable: true,
            get: function () {
              return defaultMaxListeners;
            },
            set: function (arg) {
              if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
                throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
              }
    
              defaultMaxListeners = arg;
            }
          });
    
          EventEmitter.init = function () {
            if (this._events === undefined || this._events === Object.getPrototypeOf(this)._events) {
              this._events = Object.create(null);
              this._eventsCount = 0;
            }
    
            this._maxListeners = this._maxListeners || undefined;
          }; // Obviously not all Emitters should be limited to 10. This function allows
          // that to be increased. Set to zero for unlimited.
    
    
          EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
            if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
              throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
            }
    
            this._maxListeners = n;
            return this;
          };
    
          function _getMaxListeners(that) {
            if (that._maxListeners === undefined) return EventEmitter.defaultMaxListeners;
            return that._maxListeners;
          }
    
          EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
            return _getMaxListeners(this);
          };
    
          EventEmitter.prototype.emit = function emit(type) {
            var args = [];
    
            for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
    
            var doError = type === 'error';
            var events = this._events;
            if (events !== undefined) doError = doError && events.error === undefined;else if (!doError) return false; // If there is no 'error' event listener then throw.
    
            if (doError) {
              var er;
              if (args.length > 0) er = args[0];
    
              if (er instanceof Error) {
                // Note: The comments on the `throw` lines are intentional, they show
                // up in Node's output if this results in an unhandled exception.
                throw er; // Unhandled 'error' event
              } // At least give some kind of context to the user
    
    
              var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
              err.context = er;
              throw err; // Unhandled 'error' event
            }
    
            var handler = events[type];
            if (handler === undefined) return false;
    
            if (typeof handler === 'function') {
              ReflectApply(handler, this, args);
            } else {
              var len = handler.length;
              var listeners = arrayClone(handler, len);
    
              for (var i = 0; i < len; ++i) ReflectApply(listeners[i], this, args);
            }
    
            return true;
          };
    
          function _addListener(target, type, listener, prepend) {
            var m;
            var events;
            var existing;
            checkListener(listener);
            events = target._events;
    
            if (events === undefined) {
              events = target._events = Object.create(null);
              target._eventsCount = 0;
            } else {
              // To avoid recursion in the case that type === "newListener"! Before
              // adding it to the listeners, first emit "newListener".
              if (events.newListener !== undefined) {
                target.emit('newListener', type, listener.listener ? listener.listener : listener); // Re-assign `events` because a newListener handler could have caused the
                // this._events to be assigned to a new object
    
                events = target._events;
              }
    
              existing = events[type];
            }
    
            if (existing === undefined) {
              // Optimize the case of one listener. Don't need the extra array object.
              existing = events[type] = listener;
              ++target._eventsCount;
            } else {
              if (typeof existing === 'function') {
                // Adding the second element, need to change to array.
                existing = events[type] = prepend ? [listener, existing] : [existing, listener]; // If we've already got an array, just append.
              } else if (prepend) {
                existing.unshift(listener);
              } else {
                existing.push(listener);
              } // Check for listener leak
    
    
              m = _getMaxListeners(target);
    
              if (m > 0 && existing.length > m && !existing.warned) {
                existing.warned = true; // No error code for this since it is a Warning
                // eslint-disable-next-line no-restricted-syntax
    
                var w = new Error('Possible EventEmitter memory leak detected. ' + existing.length + ' ' + String(type) + ' listeners ' + 'added. Use emitter.setMaxListeners() to ' + 'increase limit');
                w.name = 'MaxListenersExceededWarning';
                w.emitter = target;
                w.type = type;
                w.count = existing.length;
                ProcessEmitWarning(w);
              }
            }
    
            return target;
          }
    
          EventEmitter.prototype.addListener = function addListener(type, listener) {
            return _addListener(this, type, listener, false);
          };
    
          EventEmitter.prototype.on = EventEmitter.prototype.addListener;
    
          EventEmitter.prototype.prependListener = function prependListener(type, listener) {
            return _addListener(this, type, listener, true);
          };
    
          function onceWrapper() {
            if (!this.fired) {
              this.target.removeListener(this.type, this.wrapFn);
              this.fired = true;
              if (arguments.length === 0) return this.listener.call(this.target);
              return this.listener.apply(this.target, arguments);
            }
          }
    
          function _onceWrap(target, type, listener) {
            var state = {
              fired: false,
              wrapFn: undefined,
              target: target,
              type: type,
              listener: listener
            };
            var wrapped = onceWrapper.bind(state);
            wrapped.listener = listener;
            state.wrapFn = wrapped;
            return wrapped;
          }
    
          EventEmitter.prototype.once = function once(type, listener) {
            checkListener(listener);
            this.on(type, _onceWrap(this, type, listener));
            return this;
          };
    
          EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
            checkListener(listener);
            this.prependListener(type, _onceWrap(this, type, listener));
            return this;
          }; // Emits a 'removeListener' event if and only if the listener was removed.
    
    
          EventEmitter.prototype.removeListener = function removeListener(type, listener) {
            var list, events, position, i, originalListener;
            checkListener(listener);
            events = this._events;
            if (events === undefined) return this;
            list = events[type];
            if (list === undefined) return this;
    
            if (list === listener || list.listener === listener) {
              if (--this._eventsCount === 0) this._events = Object.create(null);else {
                delete events[type];
                if (events.removeListener) this.emit('removeListener', type, list.listener || listener);
              }
            } else if (typeof list !== 'function') {
              position = -1;
    
              for (i = list.length - 1; i >= 0; i--) {
                if (list[i] === listener || list[i].listener === listener) {
                  originalListener = list[i].listener;
                  position = i;
                  break;
                }
              }
    
              if (position < 0) return this;
              if (position === 0) list.shift();else {
                spliceOne(list, position);
              }
              if (list.length === 1) events[type] = list[0];
              if (events.removeListener !== undefined) this.emit('removeListener', type, originalListener || listener);
            }
    
            return this;
          };
    
          EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    
          EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
            var listeners, events, i;
            events = this._events;
            if (events === undefined) return this; // not listening for removeListener, no need to emit
    
            if (events.removeListener === undefined) {
              if (arguments.length === 0) {
                this._events = Object.create(null);
                this._eventsCount = 0;
              } else if (events[type] !== undefined) {
                if (--this._eventsCount === 0) this._events = Object.create(null);else delete events[type];
              }
    
              return this;
            } // emit removeListener for all listeners on all events
    
    
            if (arguments.length === 0) {
              var keys = Object.keys(events);
              var key;
    
              for (i = 0; i < keys.length; ++i) {
                key = keys[i];
                if (key === 'removeListener') continue;
                this.removeAllListeners(key);
              }
    
              this.removeAllListeners('removeListener');
              this._events = Object.create(null);
              this._eventsCount = 0;
              return this;
            }
    
            listeners = events[type];
    
            if (typeof listeners === 'function') {
              this.removeListener(type, listeners);
            } else if (listeners !== undefined) {
              // LIFO order
              for (i = listeners.length - 1; i >= 0; i--) {
                this.removeListener(type, listeners[i]);
              }
            }
    
            return this;
          };
    
          function _listeners(target, type, unwrap) {
            var events = target._events;
            if (events === undefined) return [];
            var evlistener = events[type];
            if (evlistener === undefined) return [];
            if (typeof evlistener === 'function') return unwrap ? [evlistener.listener || evlistener] : [evlistener];
            return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
          }
    
          EventEmitter.prototype.listeners = function listeners(type) {
            return _listeners(this, type, true);
          };
    
          EventEmitter.prototype.rawListeners = function rawListeners(type) {
            return _listeners(this, type, false);
          };
    
          EventEmitter.listenerCount = function (emitter, type) {
            if (typeof emitter.listenerCount === 'function') {
              return emitter.listenerCount(type);
            } else {
              return listenerCount.call(emitter, type);
            }
          };
    
          EventEmitter.prototype.listenerCount = listenerCount;
    
          function listenerCount(type) {
            var events = this._events;
    
            if (events !== undefined) {
              var evlistener = events[type];
    
              if (typeof evlistener === 'function') {
                return 1;
              } else if (evlistener !== undefined) {
                return evlistener.length;
              }
            }
    
            return 0;
          }
    
          EventEmitter.prototype.eventNames = function eventNames() {
            return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
          };
    
          function arrayClone(arr, n) {
            var copy = new Array(n);
    
            for (var i = 0; i < n; ++i) copy[i] = arr[i];
    
            return copy;
          }
    
          function spliceOne(list, index) {
            for (; index + 1 < list.length; index++) list[index] = list[index + 1];
    
            list.pop();
          }
    
          function unwrapListeners(arr) {
            var ret = new Array(arr.length);
    
            for (var i = 0; i < ret.length; ++i) {
              ret[i] = arr[i].listener || arr[i];
            }
    
            return ret;
          }
    
          function once(emitter, name) {
            return new Promise(function (resolve, reject) {
              function errorListener(err) {
                emitter.removeListener(name, resolver);
                reject(err);
              }
    
              function resolver() {
                if (typeof emitter.removeListener === 'function') {
                  emitter.removeListener('error', errorListener);
                }
    
                resolve([].slice.call(arguments));
              }
    
              ;
              eventTargetAgnosticAddListener(emitter, name, resolver, {
                once: true
              });
    
              if (name !== 'error') {
                addErrorHandlerIfEventEmitter(emitter, errorListener, {
                  once: true
                });
              }
            });
          }
    
          function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
            if (typeof emitter.on === 'function') {
              eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
            }
          }
    
          function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
            if (typeof emitter.on === 'function') {
              if (flags.once) {
                emitter.once(name, listener);
              } else {
                emitter.on(name, listener);
              }
            } else if (typeof emitter.addEventListener === 'function') {
              // EventTarget does not have `error` event semantics like Node
              // EventEmitters, we do not listen for `error` events here.
              emitter.addEventListener(name, function wrapListener(arg) {
                // IE does not have builtin `{ once: true }` support so we
                // have to do it manually.
                if (flags.once) {
                  emitter.removeEventListener(name, wrapListener);
                }
    
                listener(arg);
              });
            } else {
              throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
            }
          }
        }, {}],
        17: [function (require, module, exports) {
          'use strict'; // do not edit .js files directly - edit src/index.jst
    
          module.exports = function equal(a, b) {
            if (a === b) return true;
    
            if (a && b && typeof a == 'object' && typeof b == 'object') {
              if (a.constructor !== b.constructor) return false;
              var length, i, keys;
    
              if (Array.isArray(a)) {
                length = a.length;
                if (length != b.length) return false;
    
                for (i = length; i-- !== 0;) if (!equal(a[i], b[i])) return false;
    
                return true;
              }
    
              if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
              if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
              if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
              keys = Object.keys(a);
              length = keys.length;
              if (length !== Object.keys(b).length) return false;
    
              for (i = length; i-- !== 0;) if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
    
              for (i = length; i-- !== 0;) {
                var key = keys[i];
                if (!equal(a[key], b[key])) return false;
              }
    
              return true;
            } // true if both NaN, false otherwise
    
    
            return a !== a && b !== b;
          };
        }, {}],
        18: [function (require, module, exports) {
          /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
          exports.read = function (buffer, offset, isLE, mLen, nBytes) {
            var e, m;
            var eLen = nBytes * 8 - mLen - 1;
            var eMax = (1 << eLen) - 1;
            var eBias = eMax >> 1;
            var nBits = -7;
            var i = isLE ? nBytes - 1 : 0;
            var d = isLE ? -1 : 1;
            var s = buffer[offset + i];
            i += d;
            e = s & (1 << -nBits) - 1;
            s >>= -nBits;
            nBits += eLen;
    
            for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}
    
            m = e & (1 << -nBits) - 1;
            e >>= -nBits;
            nBits += mLen;
    
            for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}
    
            if (e === 0) {
              e = 1 - eBias;
            } else if (e === eMax) {
              return m ? NaN : (s ? -1 : 1) * Infinity;
            } else {
              m = m + Math.pow(2, mLen);
              e = e - eBias;
            }
    
            return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
          };
    
          exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
            var e, m, c;
            var eLen = nBytes * 8 - mLen - 1;
            var eMax = (1 << eLen) - 1;
            var eBias = eMax >> 1;
            var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
            var i = isLE ? 0 : nBytes - 1;
            var d = isLE ? 1 : -1;
            var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
            value = Math.abs(value);
    
            if (isNaN(value) || value === Infinity) {
              m = isNaN(value) ? 1 : 0;
              e = eMax;
            } else {
              e = Math.floor(Math.log(value) / Math.LN2);
    
              if (value * (c = Math.pow(2, -e)) < 1) {
                e--;
                c *= 2;
              }
    
              if (e + eBias >= 1) {
                value += rt / c;
              } else {
                value += rt * Math.pow(2, 1 - eBias);
              }
    
              if (value * c >= 2) {
                e++;
                c /= 2;
              }
    
              if (e + eBias >= eMax) {
                m = 0;
                e = eMax;
              } else if (e + eBias >= 1) {
                m = (value * c - 1) * Math.pow(2, mLen);
                e = e + eBias;
              } else {
                m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
                e = 0;
              }
            }
    
            for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}
    
            e = e << mLen | m;
            eLen += mLen;
    
            for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}
    
            buffer[offset + i - d] |= s * 128;
          };
        }, {}],
        19: [function (require, module, exports) {
          if (typeof Object.create === 'function') {
            // implementation from standard node.js 'util' module
            module.exports = function inherits(ctor, superCtor) {
              if (superCtor) {
                ctor.super_ = superCtor;
                ctor.prototype = Object.create(superCtor.prototype, {
                  constructor: {
                    value: ctor,
                    enumerable: false,
                    writable: true,
                    configurable: true
                  }
                });
              }
            };
          } else {
            // old school shim for old browsers
            module.exports = function inherits(ctor, superCtor) {
              if (superCtor) {
                ctor.super_ = superCtor;
    
                var TempCtor = function () {};
    
                TempCtor.prototype = superCtor.prototype;
                ctor.prototype = new TempCtor();
                ctor.prototype.constructor = ctor;
              }
            };
          }
        }, {}],
        20: [function (require, module, exports) {
          /*!
           * Determine if an object is a Buffer
           *
           * @author   Feross Aboukhadijeh <https://feross.org>
           * @license  MIT
           */
          // The _isBuffer check is for Safari 5-7 support, because it's missing
          // Object.prototype.constructor. Remove this eventually
          module.exports = function (obj) {
            return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer);
          };
    
          function isBuffer(obj) {
            return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
          } // For Node v0.10 support. Remove this eventually.
    
    
          function isSlowBuffer(obj) {
            return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0));
          }
        }, {}],
        21: [function (require, module, exports) {
          var toString = {}.toString;
    
          module.exports = Array.isArray || function (arr) {
            return toString.call(arr) == '[object Array]';
          };
        }, {}],
        22: [function (require, module, exports) {
          /**
           * Helpers.
           */
          var s = 1000;
          var m = s * 60;
          var h = m * 60;
          var d = h * 24;
          var w = d * 7;
          var y = d * 365.25;
          /**
           * Parse or format the given `val`.
           *
           * Options:
           *
           *  - `long` verbose formatting [false]
           *
           * @param {String|Number} val
           * @param {Object} [options]
           * @throws {Error} throw an error if val is not a non-empty string or a number
           * @return {String|Number}
           * @api public
           */
    
          module.exports = function (val, options) {
            options = options || {};
            var type = typeof val;
    
            if (type === 'string' && val.length > 0) {
              return parse(val);
            } else if (type === 'number' && isFinite(val)) {
              return options.long ? fmtLong(val) : fmtShort(val);
            }
    
            throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val));
          };
          /**
           * Parse the given `str` and return milliseconds.
           *
           * @param {String} str
           * @return {Number}
           * @api private
           */
    
    
          function parse(str) {
            str = String(str);
    
            if (str.length > 100) {
              return;
            }
    
            var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
    
            if (!match) {
              return;
            }
    
            var n = parseFloat(match[1]);
            var type = (match[2] || 'ms').toLowerCase();
    
            switch (type) {
              case 'years':
              case 'year':
              case 'yrs':
              case 'yr':
              case 'y':
                return n * y;
    
              case 'weeks':
              case 'week':
              case 'w':
                return n * w;
    
              case 'days':
              case 'day':
              case 'd':
                return n * d;
    
              case 'hours':
              case 'hour':
              case 'hrs':
              case 'hr':
              case 'h':
                return n * h;
    
              case 'minutes':
              case 'minute':
              case 'mins':
              case 'min':
              case 'm':
                return n * m;
    
              case 'seconds':
              case 'second':
              case 'secs':
              case 'sec':
              case 's':
                return n * s;
    
              case 'milliseconds':
              case 'millisecond':
              case 'msecs':
              case 'msec':
              case 'ms':
                return n;
    
              default:
                return undefined;
            }
          }
          /**
           * Short format for `ms`.
           *
           * @param {Number} ms
           * @return {String}
           * @api private
           */
    
    
          function fmtShort(ms) {
            var msAbs = Math.abs(ms);
    
            if (msAbs >= d) {
              return Math.round(ms / d) + 'd';
            }
    
            if (msAbs >= h) {
              return Math.round(ms / h) + 'h';
            }
    
            if (msAbs >= m) {
              return Math.round(ms / m) + 'm';
            }
    
            if (msAbs >= s) {
              return Math.round(ms / s) + 's';
            }
    
            return ms + 'ms';
          }
          /**
           * Long format for `ms`.
           *
           * @param {Number} ms
           * @return {String}
           * @api private
           */
    
    
          function fmtLong(ms) {
            var msAbs = Math.abs(ms);
    
            if (msAbs >= d) {
              return plural(ms, msAbs, d, 'day');
            }
    
            if (msAbs >= h) {
              return plural(ms, msAbs, h, 'hour');
            }
    
            if (msAbs >= m) {
              return plural(ms, msAbs, m, 'minute');
            }
    
            if (msAbs >= s) {
              return plural(ms, msAbs, s, 'second');
            }
    
            return ms + ' ms';
          }
          /**
           * Pluralization helper.
           */
    
    
          function plural(ms, msAbs, n, name) {
            var isPlural = msAbs >= n * 1.5;
            return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
          }
        }, {}],
        23: [function (require, module, exports) {
          (function (process) {
            (function () {
              'use strict';
    
              if (!process.version || process.version.indexOf('v0.') === 0 || process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
                module.exports = nextTick;
              } else {
                module.exports = process.nextTick;
              }
    
              function nextTick(fn, arg1, arg2, arg3) {
                if (typeof fn !== 'function') {
                  throw new TypeError('"callback" argument must be a function');
                }
    
                var len = arguments.length;
                var args, i;
    
                switch (len) {
                  case 0:
                  case 1:
                    return process.nextTick(fn);
    
                  case 2:
                    return process.nextTick(function afterTickOne() {
                      fn.call(null, arg1);
                    });
    
                  case 3:
                    return process.nextTick(function afterTickTwo() {
                      fn.call(null, arg1, arg2);
                    });
    
                  case 4:
                    return process.nextTick(function afterTickThree() {
                      fn.call(null, arg1, arg2, arg3);
                    });
    
                  default:
                    args = new Array(len - 1);
                    i = 0;
    
                    while (i < args.length) {
                      args[i++] = arguments[i];
                    }
    
                    return process.nextTick(function afterTick() {
                      fn.apply(null, args);
                    });
                }
              }
            }).call(this);
          }).call(this, require('_process'));
        }, {
          "_process": 24
        }],
        24: [function (require, module, exports) {
          // shim for using process in browser
          var process = module.exports = {}; // cached from whatever global is present so that test runners that stub it
          // don't break things.  But we need to wrap it in a try catch in case it is
          // wrapped in strict mode code which doesn't define any globals.  It's inside a
          // function because try/catches deoptimize in certain engines.
    
          var cachedSetTimeout;
          var cachedClearTimeout;
    
          function defaultSetTimout() {
            throw new Error('setTimeout has not been defined');
          }
    
          function defaultClearTimeout() {
            throw new Error('clearTimeout has not been defined');
          }
    
          (function () {
            try {
              if (typeof setTimeout === 'function') {
                cachedSetTimeout = setTimeout;
              } else {
                cachedSetTimeout = defaultSetTimout;
              }
            } catch (e) {
              cachedSetTimeout = defaultSetTimout;
            }
    
            try {
              if (typeof clearTimeout === 'function') {
                cachedClearTimeout = clearTimeout;
              } else {
                cachedClearTimeout = defaultClearTimeout;
              }
            } catch (e) {
              cachedClearTimeout = defaultClearTimeout;
            }
          })();
    
          function runTimeout(fun) {
            if (cachedSetTimeout === setTimeout) {
              //normal enviroments in sane situations
              return setTimeout(fun, 0);
            } // if setTimeout wasn't available but was latter defined
    
    
            if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
              cachedSetTimeout = setTimeout;
              return setTimeout(fun, 0);
            }
    
            try {
              // when when somebody has screwed with setTimeout but no I.E. maddness
              return cachedSetTimeout(fun, 0);
            } catch (e) {
              try {
                // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
                return cachedSetTimeout.call(null, fun, 0);
              } catch (e) {
                // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
                return cachedSetTimeout.call(this, fun, 0);
              }
            }
          }
    
          function runClearTimeout(marker) {
            if (cachedClearTimeout === clearTimeout) {
              //normal enviroments in sane situations
              return clearTimeout(marker);
            } // if clearTimeout wasn't available but was latter defined
    
    
            if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
              cachedClearTimeout = clearTimeout;
              return clearTimeout(marker);
            }
    
            try {
              // when when somebody has screwed with setTimeout but no I.E. maddness
              return cachedClearTimeout(marker);
            } catch (e) {
              try {
                // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
                return cachedClearTimeout.call(null, marker);
              } catch (e) {
                // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
                // Some versions of I.E. have different rules for clearTimeout vs setTimeout
                return cachedClearTimeout.call(this, marker);
              }
            }
          }
    
          var queue = [];
          var draining = false;
          var currentQueue;
          var queueIndex = -1;
    
          function cleanUpNextTick() {
            if (!draining || !currentQueue) {
              return;
            }
    
            draining = false;
    
            if (currentQueue.length) {
              queue = currentQueue.concat(queue);
            } else {
              queueIndex = -1;
            }
    
            if (queue.length) {
              drainQueue();
            }
          }
    
          function drainQueue() {
            if (draining) {
              return;
            }
    
            var timeout = runTimeout(cleanUpNextTick);
            draining = true;
            var len = queue.length;
    
            while (len) {
              currentQueue = queue;
              queue = [];
    
              while (++queueIndex < len) {
                if (currentQueue) {
                  currentQueue[queueIndex].run();
                }
              }
    
              queueIndex = -1;
              len = queue.length;
            }
    
            currentQueue = null;
            draining = false;
            runClearTimeout(timeout);
          }
    
          process.nextTick = function (fun) {
            var args = new Array(arguments.length - 1);
    
            if (arguments.length > 1) {
              for (var i = 1; i < arguments.length; i++) {
                args[i - 1] = arguments[i];
              }
            }
    
            queue.push(new Item(fun, args));
    
            if (queue.length === 1 && !draining) {
              runTimeout(drainQueue);
            }
          }; // v8 likes predictible objects
    
    
          function Item(fun, array) {
            this.fun = fun;
            this.array = array;
          }
    
          Item.prototype.run = function () {
            this.fun.apply(null, this.array);
          };
    
          process.title = 'browser';
          process.browser = true;
          process.env = {};
          process.argv = [];
          process.version = ''; // empty string to avoid regexp issues
    
          process.versions = {};
    
          function noop() {}
    
          process.on = noop;
          process.addListener = noop;
          process.once = noop;
          process.off = noop;
          process.removeListener = noop;
          process.removeAllListeners = noop;
          process.emit = noop;
          process.prependListener = noop;
          process.prependOnceListener = noop;
    
          process.listeners = function (name) {
            return [];
          };
    
          process.binding = function (name) {
            throw new Error('process.binding is not supported');
          };
    
          process.cwd = function () {
            return '/';
          };
    
          process.chdir = function (dir) {
            throw new Error('process.chdir is not supported');
          };
    
          process.umask = function () {
            return 0;
          };
        }, {}],
        25: [function (require, module, exports) {
          // Copyright Joyent, Inc. and other Node contributors.
          //
          // Permission is hereby granted, free of charge, to any person obtaining a
          // copy of this software and associated documentation files (the
          // "Software"), to deal in the Software without restriction, including
          // without limitation the rights to use, copy, modify, merge, publish,
          // distribute, sublicense, and/or sell copies of the Software, and to permit
          // persons to whom the Software is furnished to do so, subject to the
          // following conditions:
          //
          // The above copyright notice and this permission notice shall be included
          // in all copies or substantial portions of the Software.
          //
          // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
          // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
          // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
          // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
          // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
          // USE OR OTHER DEALINGS IN THE SOFTWARE.
          // a duplex stream is just a stream that is both readable and writable.
          // Since JS doesn't have multiple prototypal inheritance, this class
          // prototypally inherits from Readable, and then parasitically from
          // Writable.
          'use strict';
          /*<replacement>*/
    
          var processNextTick = require('process-nextick-args');
          /*</replacement>*/
    
          /*<replacement>*/
    
    
          var objectKeys = Object.keys || function (obj) {
            var keys = [];
    
            for (var key in obj) {
              keys.push(key);
            }
    
            return keys;
          };
          /*</replacement>*/
    
    
          module.exports = Duplex;
          /*<replacement>*/
    
          var util = require('core-util-is');
    
          util.inherits = require('inherits');
          /*</replacement>*/
    
          var Readable = require('./_stream_readable');
    
          var Writable = require('./_stream_writable');
    
          util.inherits(Duplex, Readable);
          var keys = objectKeys(Writable.prototype);
    
          for (var v = 0; v < keys.length; v++) {
            var method = keys[v];
            if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
          }
    
          function Duplex(options) {
            if (!(this instanceof Duplex)) return new Duplex(options);
            Readable.call(this, options);
            Writable.call(this, options);
            if (options && options.readable === false) this.readable = false;
            if (options && options.writable === false) this.writable = false;
            this.allowHalfOpen = true;
            if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;
            this.once('end', onend);
          } // the no-half-open enforcer
    
    
          function onend() {
            // if we allow half-open state, or if the writable side ended,
            // then we're ok.
            if (this.allowHalfOpen || this._writableState.ended) return; // no more data can be written.
            // But allow more writes to happen in this tick.
    
            processNextTick(onEndNT, this);
          }
    
          function onEndNT(self) {
            self.end();
          }
    
          Object.defineProperty(Duplex.prototype, 'destroyed', {
            get: function () {
              if (this._readableState === undefined || this._writableState === undefined) {
                return false;
              }
    
              return this._readableState.destroyed && this._writableState.destroyed;
            },
            set: function (value) {
              // we ignore the value if the stream
              // has not been initialized yet
              if (this._readableState === undefined || this._writableState === undefined) {
                return;
              } // backward compatibility, the user is explicitly
              // managing destroyed
    
    
              this._readableState.destroyed = value;
              this._writableState.destroyed = value;
            }
          });
    
          Duplex.prototype._destroy = function (err, cb) {
            this.push(null);
            this.end();
            processNextTick(cb, err);
          };
    
          function forEach(xs, f) {
            for (var i = 0, l = xs.length; i < l; i++) {
              f(xs[i], i);
            }
          }
        }, {
          "./_stream_readable": 27,
          "./_stream_writable": 29,
          "core-util-is": 13,
          "inherits": 19,
          "process-nextick-args": 23
        }],
        26: [function (require, module, exports) {
          // Copyright Joyent, Inc. and other Node contributors.
          //
          // Permission is hereby granted, free of charge, to any person obtaining a
          // copy of this software and associated documentation files (the
          // "Software"), to deal in the Software without restriction, including
          // without limitation the rights to use, copy, modify, merge, publish,
          // distribute, sublicense, and/or sell copies of the Software, and to permit
          // persons to whom the Software is furnished to do so, subject to the
          // following conditions:
          //
          // The above copyright notice and this permission notice shall be included
          // in all copies or substantial portions of the Software.
          //
          // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
          // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
          // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
          // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
          // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
          // USE OR OTHER DEALINGS IN THE SOFTWARE.
          // a passthrough stream.
          // basically just the most minimal sort of Transform stream.
          // Every written chunk gets output as-is.
          'use strict';
    
          module.exports = PassThrough;
    
          var Transform = require('./_stream_transform');
          /*<replacement>*/
    
    
          var util = require('core-util-is');
    
          util.inherits = require('inherits');
          /*</replacement>*/
    
          util.inherits(PassThrough, Transform);
    
          function PassThrough(options) {
            if (!(this instanceof PassThrough)) return new PassThrough(options);
            Transform.call(this, options);
          }
    
          PassThrough.prototype._transform = function (chunk, encoding, cb) {
            cb(null, chunk);
          };
        }, {
          "./_stream_transform": 28,
          "core-util-is": 13,
          "inherits": 19
        }],
        27: [function (require, module, exports) {
          (function (process, global) {
            (function () {
              // Copyright Joyent, Inc. and other Node contributors.
              //
              // Permission is hereby granted, free of charge, to any person obtaining a
              // copy of this software and associated documentation files (the
              // "Software"), to deal in the Software without restriction, including
              // without limitation the rights to use, copy, modify, merge, publish,
              // distribute, sublicense, and/or sell copies of the Software, and to permit
              // persons to whom the Software is furnished to do so, subject to the
              // following conditions:
              //
              // The above copyright notice and this permission notice shall be included
              // in all copies or substantial portions of the Software.
              //
              // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
              // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
              // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
              // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
              // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
              // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
              // USE OR OTHER DEALINGS IN THE SOFTWARE.
              'use strict';
              /*<replacement>*/
    
              var processNextTick = require('process-nextick-args');
              /*</replacement>*/
    
    
              module.exports = Readable;
              /*<replacement>*/
    
              var isArray = require('isarray');
              /*</replacement>*/
    
              /*<replacement>*/
    
    
              var Duplex;
              /*</replacement>*/
    
              Readable.ReadableState = ReadableState;
              /*<replacement>*/
    
              var EE = require('events').EventEmitter;
    
              var EElistenerCount = function (emitter, type) {
                return emitter.listeners(type).length;
              };
              /*</replacement>*/
    
              /*<replacement>*/
    
    
              var Stream = require('./internal/streams/stream');
              /*</replacement>*/
              // TODO(bmeurer): Change this back to const once hole checks are
              // properly optimized away early in Ignition+TurboFan.
    
              /*<replacement>*/
    
    
              var Buffer = require('safe-buffer').Buffer;
    
              var OurUint8Array = global.Uint8Array || function () {};
    
              function _uint8ArrayToBuffer(chunk) {
                return Buffer.from(chunk);
              }
    
              function _isUint8Array(obj) {
                return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
              }
              /*</replacement>*/
    
              /*<replacement>*/
    
    
              var util = require('core-util-is');
    
              util.inherits = require('inherits');
              /*</replacement>*/
    
              /*<replacement>*/
    
              var debugUtil = require('util');
    
              var debug = void 0;
    
              if (debugUtil && debugUtil.debuglog) {
                debug = debugUtil.debuglog('stream');
              } else {
                debug = function () {};
              }
              /*</replacement>*/
    
    
              var BufferList = require('./internal/streams/BufferList');
    
              var destroyImpl = require('./internal/streams/destroy');
    
              var StringDecoder;
              util.inherits(Readable, Stream);
              var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];
    
              function prependListener(emitter, event, fn) {
                // Sadly this is not cacheable as some libraries bundle their own
                // event emitter implementation with them.
                if (typeof emitter.prependListener === 'function') {
                  return emitter.prependListener(event, fn);
                } else {
                  // This is a hack to make sure that our error handler is attached before any
                  // userland ones.  NEVER DO THIS. This is here only because this code needs
                  // to continue to work with older versions of Node.js that do not include
                  // the prependListener() method. The goal is to eventually remove this hack.
                  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
                }
              }
    
              function ReadableState(options, stream) {
                Duplex = Duplex || require('./_stream_duplex');
                options = options || {}; // object stream flag. Used to make read(n) ignore n and to
                // make all the buffer merging and length checks go away
    
                this.objectMode = !!options.objectMode;
                if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode; // the point at which it stops calling _read() to fill the buffer
                // Note: 0 is a valid value, means "don't call _read preemptively ever"
    
                var hwm = options.highWaterMark;
                var defaultHwm = this.objectMode ? 16 : 16 * 1024;
                this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm; // cast to ints.
    
                this.highWaterMark = Math.floor(this.highWaterMark); // A linked list is used to store data chunks instead of an array because the
                // linked list can remove elements from the beginning faster than
                // array.shift()
    
                this.buffer = new BufferList();
                this.length = 0;
                this.pipes = null;
                this.pipesCount = 0;
                this.flowing = null;
                this.ended = false;
                this.endEmitted = false;
                this.reading = false; // a flag to be able to tell if the event 'readable'/'data' is emitted
                // immediately, or on a later tick.  We set this to true at first, because
                // any actions that shouldn't happen until "later" should generally also
                // not happen before the first read call.
    
                this.sync = true; // whenever we return null, then we set a flag to say
                // that we're awaiting a 'readable' event emission.
    
                this.needReadable = false;
                this.emittedReadable = false;
                this.readableListening = false;
                this.resumeScheduled = false; // has it been destroyed
    
                this.destroyed = false; // Crypto is kind of old and crusty.  Historically, its default string
                // encoding is 'binary' so we have to make this configurable.
                // Everything else in the universe uses 'utf8', though.
    
                this.defaultEncoding = options.defaultEncoding || 'utf8'; // the number of writers that are awaiting a drain event in .pipe()s
    
                this.awaitDrain = 0; // if true, a maybeReadMore has been scheduled
    
                this.readingMore = false;
                this.decoder = null;
                this.encoding = null;
    
                if (options.encoding) {
                  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
                  this.decoder = new StringDecoder(options.encoding);
                  this.encoding = options.encoding;
                }
              }
    
              function Readable(options) {
                Duplex = Duplex || require('./_stream_duplex');
                if (!(this instanceof Readable)) return new Readable(options);
                this._readableState = new ReadableState(options, this); // legacy
    
                this.readable = true;
    
                if (options) {
                  if (typeof options.read === 'function') this._read = options.read;
                  if (typeof options.destroy === 'function') this._destroy = options.destroy;
                }
    
                Stream.call(this);
              }
    
              Object.defineProperty(Readable.prototype, 'destroyed', {
                get: function () {
                  if (this._readableState === undefined) {
                    return false;
                  }
    
                  return this._readableState.destroyed;
                },
                set: function (value) {
                  // we ignore the value if the stream
                  // has not been initialized yet
                  if (!this._readableState) {
                    return;
                  } // backward compatibility, the user is explicitly
                  // managing destroyed
    
    
                  this._readableState.destroyed = value;
                }
              });
              Readable.prototype.destroy = destroyImpl.destroy;
              Readable.prototype._undestroy = destroyImpl.undestroy;
    
              Readable.prototype._destroy = function (err, cb) {
                this.push(null);
                cb(err);
              }; // Manually shove something into the read() buffer.
              // This returns true if the highWaterMark has not been hit yet,
              // similar to how Writable.write() returns true if you should
              // write() some more.
    
    
              Readable.prototype.push = function (chunk, encoding) {
                var state = this._readableState;
                var skipChunkCheck;
    
                if (!state.objectMode) {
                  if (typeof chunk === 'string') {
                    encoding = encoding || state.defaultEncoding;
    
                    if (encoding !== state.encoding) {
                      chunk = Buffer.from(chunk, encoding);
                      encoding = '';
                    }
    
                    skipChunkCheck = true;
                  }
                } else {
                  skipChunkCheck = true;
                }
    
                return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
              }; // Unshift should *always* be something directly out of read()
    
    
              Readable.prototype.unshift = function (chunk) {
                return readableAddChunk(this, chunk, null, true, false);
              };
    
              function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
                var state = stream._readableState;
    
                if (chunk === null) {
                  state.reading = false;
                  onEofChunk(stream, state);
                } else {
                  var er;
                  if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    
                  if (er) {
                    stream.emit('error', er);
                  } else if (state.objectMode || chunk && chunk.length > 0) {
                    if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
                      chunk = _uint8ArrayToBuffer(chunk);
                    }
    
                    if (addToFront) {
                      if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
                    } else if (state.ended) {
                      stream.emit('error', new Error('stream.push() after EOF'));
                    } else {
                      state.reading = false;
    
                      if (state.decoder && !encoding) {
                        chunk = state.decoder.write(chunk);
                        if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
                      } else {
                        addChunk(stream, state, chunk, false);
                      }
                    }
                  } else if (!addToFront) {
                    state.reading = false;
                  }
                }
    
                return needMoreData(state);
              }
    
              function addChunk(stream, state, chunk, addToFront) {
                if (state.flowing && state.length === 0 && !state.sync) {
                  stream.emit('data', chunk);
                  stream.read(0);
                } else {
                  // update the buffer info.
                  state.length += state.objectMode ? 1 : chunk.length;
                  if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);
                  if (state.needReadable) emitReadable(stream);
                }
    
                maybeReadMore(stream, state);
              }
    
              function chunkInvalid(state, chunk) {
                var er;
    
                if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
                  er = new TypeError('Invalid non-string/buffer chunk');
                }
    
                return er;
              } // if it's past the high water mark, we can push in some more.
              // Also, if we have no data yet, we can stand some
              // more bytes.  This is to work around cases where hwm=0,
              // such as the repl.  Also, if the push() triggered a
              // readable event, and the user called read(largeNumber) such that
              // needReadable was set, then we ought to push more, so that another
              // 'readable' event will be triggered.
    
    
              function needMoreData(state) {
                return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
              }
    
              Readable.prototype.isPaused = function () {
                return this._readableState.flowing === false;
              }; // backwards compatibility.
    
    
              Readable.prototype.setEncoding = function (enc) {
                if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
                this._readableState.decoder = new StringDecoder(enc);
                this._readableState.encoding = enc;
                return this;
              }; // Don't raise the hwm > 8MB
    
    
              var MAX_HWM = 0x800000;
    
              function computeNewHighWaterMark(n) {
                if (n >= MAX_HWM) {
                  n = MAX_HWM;
                } else {
                  // Get the next highest power of 2 to prevent increasing hwm excessively in
                  // tiny amounts
                  n--;
                  n |= n >>> 1;
                  n |= n >>> 2;
                  n |= n >>> 4;
                  n |= n >>> 8;
                  n |= n >>> 16;
                  n++;
                }
    
                return n;
              } // This function is designed to be inlinable, so please take care when making
              // changes to the function body.
    
    
              function howMuchToRead(n, state) {
                if (n <= 0 || state.length === 0 && state.ended) return 0;
                if (state.objectMode) return 1;
    
                if (n !== n) {
                  // Only flow one buffer at a time
                  if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
                } // If we're asking for more than the current hwm, then raise the hwm.
    
    
                if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
                if (n <= state.length) return n; // Don't have enough
    
                if (!state.ended) {
                  state.needReadable = true;
                  return 0;
                }
    
                return state.length;
              } // you can override either this method, or the async _read(n) below.
    
    
              Readable.prototype.read = function (n) {
                debug('read', n);
                n = parseInt(n, 10);
                var state = this._readableState;
                var nOrig = n;
                if (n !== 0) state.emittedReadable = false; // if we're doing read(0) to trigger a readable event, but we
                // already have a bunch of data in the buffer, then just trigger
                // the 'readable' event and move on.
    
                if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
                  debug('read: emitReadable', state.length, state.ended);
                  if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
                  return null;
                }
    
                n = howMuchToRead(n, state); // if we've ended, and we're now clear, then finish it up.
    
                if (n === 0 && state.ended) {
                  if (state.length === 0) endReadable(this);
                  return null;
                } // All the actual chunk generation logic needs to be
                // *below* the call to _read.  The reason is that in certain
                // synthetic stream cases, such as passthrough streams, _read
                // may be a completely synchronous operation which may change
                // the state of the read buffer, providing enough data when
                // before there was *not* enough.
                //
                // So, the steps are:
                // 1. Figure out what the state of things will be after we do
                // a read from the buffer.
                //
                // 2. If that resulting state will trigger a _read, then call _read.
                // Note that this may be asynchronous, or synchronous.  Yes, it is
                // deeply ugly to write APIs this way, but that still doesn't mean
                // that the Readable class should behave improperly, as streams are
                // designed to be sync/async agnostic.
                // Take note if the _read call is sync or async (ie, if the read call
                // has returned yet), so that we know whether or not it's safe to emit
                // 'readable' etc.
                //
                // 3. Actually pull the requested chunks out of the buffer and return.
                // if we need a readable event, then we need to do some reading.
    
    
                var doRead = state.needReadable;
                debug('need readable', doRead); // if we currently have less than the highWaterMark, then also read some
    
                if (state.length === 0 || state.length - n < state.highWaterMark) {
                  doRead = true;
                  debug('length less than watermark', doRead);
                } // however, if we've ended, then there's no point, and if we're already
                // reading, then it's unnecessary.
    
    
                if (state.ended || state.reading) {
                  doRead = false;
                  debug('reading or ended', doRead);
                } else if (doRead) {
                  debug('do read');
                  state.reading = true;
                  state.sync = true; // if the length is currently zero, then we *need* a readable event.
    
                  if (state.length === 0) state.needReadable = true; // call internal read method
    
                  this._read(state.highWaterMark);
    
                  state.sync = false; // If _read pushed data synchronously, then `reading` will be false,
                  // and we need to re-evaluate how much data we can return to the user.
    
                  if (!state.reading) n = howMuchToRead(nOrig, state);
                }
    
                var ret;
                if (n > 0) ret = fromList(n, state);else ret = null;
    
                if (ret === null) {
                  state.needReadable = true;
                  n = 0;
                } else {
                  state.length -= n;
                }
    
                if (state.length === 0) {
                  // If we have nothing in the buffer, then we want to know
                  // as soon as we *do* get something into the buffer.
                  if (!state.ended) state.needReadable = true; // If we tried to read() past the EOF, then emit end on the next tick.
    
                  if (nOrig !== n && state.ended) endReadable(this);
                }
    
                if (ret !== null) this.emit('data', ret);
                return ret;
              };
    
              function onEofChunk(stream, state) {
                if (state.ended) return;
    
                if (state.decoder) {
                  var chunk = state.decoder.end();
    
                  if (chunk && chunk.length) {
                    state.buffer.push(chunk);
                    state.length += state.objectMode ? 1 : chunk.length;
                  }
                }
    
                state.ended = true; // emit 'readable' now to make sure it gets picked up.
    
                emitReadable(stream);
              } // Don't emit readable right away in sync mode, because this can trigger
              // another read() call => stack overflow.  This way, it might trigger
              // a nextTick recursion warning, but that's not so bad.
    
    
              function emitReadable(stream) {
                var state = stream._readableState;
                state.needReadable = false;
    
                if (!state.emittedReadable) {
                  debug('emitReadable', state.flowing);
                  state.emittedReadable = true;
                  if (state.sync) processNextTick(emitReadable_, stream);else emitReadable_(stream);
                }
              }
    
              function emitReadable_(stream) {
                debug('emit readable');
                stream.emit('readable');
                flow(stream);
              } // at this point, the user has presumably seen the 'readable' event,
              // and called read() to consume some data.  that may have triggered
              // in turn another _read(n) call, in which case reading = true if
              // it's in progress.
              // However, if we're not ended, or reading, and the length < hwm,
              // then go ahead and try to read some more preemptively.
    
    
              function maybeReadMore(stream, state) {
                if (!state.readingMore) {
                  state.readingMore = true;
                  processNextTick(maybeReadMore_, stream, state);
                }
              }
    
              function maybeReadMore_(stream, state) {
                var len = state.length;
    
                while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
                  debug('maybeReadMore read 0');
                  stream.read(0);
                  if (len === state.length) // didn't get any data, stop spinning.
                    break;else len = state.length;
                }
    
                state.readingMore = false;
              } // abstract method.  to be overridden in specific implementation classes.
              // call cb(er, data) where data is <= n in length.
              // for virtual (non-string, non-buffer) streams, "length" is somewhat
              // arbitrary, and perhaps not very meaningful.
    
    
              Readable.prototype._read = function (n) {
                this.emit('error', new Error('_read() is not implemented'));
              };
    
              Readable.prototype.pipe = function (dest, pipeOpts) {
                var src = this;
                var state = this._readableState;
    
                switch (state.pipesCount) {
                  case 0:
                    state.pipes = dest;
                    break;
    
                  case 1:
                    state.pipes = [state.pipes, dest];
                    break;
    
                  default:
                    state.pipes.push(dest);
                    break;
                }
    
                state.pipesCount += 1;
                debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);
                var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
                var endFn = doEnd ? onend : unpipe;
                if (state.endEmitted) processNextTick(endFn);else src.once('end', endFn);
                dest.on('unpipe', onunpipe);
    
                function onunpipe(readable, unpipeInfo) {
                  debug('onunpipe');
    
                  if (readable === src) {
                    if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
                      unpipeInfo.hasUnpiped = true;
                      cleanup();
                    }
                  }
                }
    
                function onend() {
                  debug('onend');
                  dest.end();
                } // when the dest drains, it reduces the awaitDrain counter
                // on the source.  This would be more elegant with a .once()
                // handler in flow(), but adding and removing repeatedly is
                // too slow.
    
    
                var ondrain = pipeOnDrain(src);
                dest.on('drain', ondrain);
                var cleanedUp = false;
    
                function cleanup() {
                  debug('cleanup'); // cleanup event handlers once the pipe is broken
    
                  dest.removeListener('close', onclose);
                  dest.removeListener('finish', onfinish);
                  dest.removeListener('drain', ondrain);
                  dest.removeListener('error', onerror);
                  dest.removeListener('unpipe', onunpipe);
                  src.removeListener('end', onend);
                  src.removeListener('end', unpipe);
                  src.removeListener('data', ondata);
                  cleanedUp = true; // if the reader is waiting for a drain event from this
                  // specific writer, then it would cause it to never start
                  // flowing again.
                  // So, if this is awaiting a drain, then we just call it now.
                  // If we don't know, then assume that we are waiting for one.
    
                  if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
                } // If the user pushes more data while we're writing to dest then we'll end up
                // in ondata again. However, we only want to increase awaitDrain once because
                // dest will only emit one 'drain' event for the multiple writes.
                // => Introduce a guard on increasing awaitDrain.
    
    
                var increasedAwaitDrain = false;
                src.on('data', ondata);
    
                function ondata(chunk) {
                  debug('ondata');
                  increasedAwaitDrain = false;
                  var ret = dest.write(chunk);
    
                  if (false === ret && !increasedAwaitDrain) {
                    // If the user unpiped during `dest.write()`, it is possible
                    // to get stuck in a permanently paused state if that write
                    // also returned false.
                    // => Check whether `dest` is still a piping destination.
                    if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
                      debug('false write response, pause', src._readableState.awaitDrain);
                      src._readableState.awaitDrain++;
                      increasedAwaitDrain = true;
                    }
    
                    src.pause();
                  }
                } // if the dest has an error, then stop piping into it.
                // however, don't suppress the throwing behavior for this.
    
    
                function onerror(er) {
                  debug('onerror', er);
                  unpipe();
                  dest.removeListener('error', onerror);
                  if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
                } // Make sure our error handler is attached before userland ones.
    
    
                prependListener(dest, 'error', onerror); // Both close and finish should trigger unpipe, but only once.
    
                function onclose() {
                  dest.removeListener('finish', onfinish);
                  unpipe();
                }
    
                dest.once('close', onclose);
    
                function onfinish() {
                  debug('onfinish');
                  dest.removeListener('close', onclose);
                  unpipe();
                }
    
                dest.once('finish', onfinish);
    
                function unpipe() {
                  debug('unpipe');
                  src.unpipe(dest);
                } // tell the dest that it's being piped to
    
    
                dest.emit('pipe', src); // start the flow if it hasn't been started already.
    
                if (!state.flowing) {
                  debug('pipe resume');
                  src.resume();
                }
    
                return dest;
              };
    
              function pipeOnDrain(src) {
                return function () {
                  var state = src._readableState;
                  debug('pipeOnDrain', state.awaitDrain);
                  if (state.awaitDrain) state.awaitDrain--;
    
                  if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
                    state.flowing = true;
                    flow(src);
                  }
                };
              }
    
              Readable.prototype.unpipe = function (dest) {
                var state = this._readableState;
                var unpipeInfo = {
                  hasUnpiped: false
                }; // if we're not piping anywhere, then do nothing.
    
                if (state.pipesCount === 0) return this; // just one destination.  most common case.
    
                if (state.pipesCount === 1) {
                  // passed in one, but it's not the right one.
                  if (dest && dest !== state.pipes) return this;
                  if (!dest) dest = state.pipes; // got a match.
    
                  state.pipes = null;
                  state.pipesCount = 0;
                  state.flowing = false;
                  if (dest) dest.emit('unpipe', this, unpipeInfo);
                  return this;
                } // slow case. multiple pipe destinations.
    
    
                if (!dest) {
                  // remove all.
                  var dests = state.pipes;
                  var len = state.pipesCount;
                  state.pipes = null;
                  state.pipesCount = 0;
                  state.flowing = false;
    
                  for (var i = 0; i < len; i++) {
                    dests[i].emit('unpipe', this, unpipeInfo);
                  }
    
                  return this;
                } // try to find the right one.
    
    
                var index = indexOf(state.pipes, dest);
                if (index === -1) return this;
                state.pipes.splice(index, 1);
                state.pipesCount -= 1;
                if (state.pipesCount === 1) state.pipes = state.pipes[0];
                dest.emit('unpipe', this, unpipeInfo);
                return this;
              }; // set up data events if they are asked for
              // Ensure readable listeners eventually get something
    
    
              Readable.prototype.on = function (ev, fn) {
                var res = Stream.prototype.on.call(this, ev, fn);
    
                if (ev === 'data') {
                  // Start flowing on next tick if stream isn't explicitly paused
                  if (this._readableState.flowing !== false) this.resume();
                } else if (ev === 'readable') {
                  var state = this._readableState;
    
                  if (!state.endEmitted && !state.readableListening) {
                    state.readableListening = state.needReadable = true;
                    state.emittedReadable = false;
    
                    if (!state.reading) {
                      processNextTick(nReadingNextTick, this);
                    } else if (state.length) {
                      emitReadable(this);
                    }
                  }
                }
    
                return res;
              };
    
              Readable.prototype.addListener = Readable.prototype.on;
    
              function nReadingNextTick(self) {
                debug('readable nexttick read 0');
                self.read(0);
              } // pause() and resume() are remnants of the legacy readable stream API
              // If the user uses them, then switch into old mode.
    
    
              Readable.prototype.resume = function () {
                var state = this._readableState;
    
                if (!state.flowing) {
                  debug('resume');
                  state.flowing = true;
                  resume(this, state);
                }
    
                return this;
              };
    
              function resume(stream, state) {
                if (!state.resumeScheduled) {
                  state.resumeScheduled = true;
                  processNextTick(resume_, stream, state);
                }
              }
    
              function resume_(stream, state) {
                if (!state.reading) {
                  debug('resume read 0');
                  stream.read(0);
                }
    
                state.resumeScheduled = false;
                state.awaitDrain = 0;
                stream.emit('resume');
                flow(stream);
                if (state.flowing && !state.reading) stream.read(0);
              }
    
              Readable.prototype.pause = function () {
                debug('call pause flowing=%j', this._readableState.flowing);
    
                if (false !== this._readableState.flowing) {
                  debug('pause');
                  this._readableState.flowing = false;
                  this.emit('pause');
                }
    
                return this;
              };
    
              function flow(stream) {
                var state = stream._readableState;
                debug('flow', state.flowing);
    
                while (state.flowing && stream.read() !== null) {}
              } // wrap an old-style stream as the async data source.
              // This is *not* part of the readable stream interface.
              // It is an ugly unfortunate mess of history.
    
    
              Readable.prototype.wrap = function (stream) {
                var state = this._readableState;
                var paused = false;
                var self = this;
                stream.on('end', function () {
                  debug('wrapped end');
    
                  if (state.decoder && !state.ended) {
                    var chunk = state.decoder.end();
                    if (chunk && chunk.length) self.push(chunk);
                  }
    
                  self.push(null);
                });
                stream.on('data', function (chunk) {
                  debug('wrapped data');
                  if (state.decoder) chunk = state.decoder.write(chunk); // don't skip over falsy values in objectMode
    
                  if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;
                  var ret = self.push(chunk);
    
                  if (!ret) {
                    paused = true;
                    stream.pause();
                  }
                }); // proxy all the other methods.
                // important when wrapping filters and duplexes.
    
                for (var i in stream) {
                  if (this[i] === undefined && typeof stream[i] === 'function') {
                    this[i] = function (method) {
                      return function () {
                        return stream[method].apply(stream, arguments);
                      };
                    }(i);
                  }
                } // proxy certain important events.
    
    
                for (var n = 0; n < kProxyEvents.length; n++) {
                  stream.on(kProxyEvents[n], self.emit.bind(self, kProxyEvents[n]));
                } // when we try to consume some more bytes, simply unpause the
                // underlying stream.
    
    
                self._read = function (n) {
                  debug('wrapped _read', n);
    
                  if (paused) {
                    paused = false;
                    stream.resume();
                  }
                };
    
                return self;
              }; // exposed for testing purposes only.
    
    
              Readable._fromList = fromList; // Pluck off n bytes from an array of buffers.
              // Length is the combined lengths of all the buffers in the list.
              // This function is designed to be inlinable, so please take care when making
              // changes to the function body.
    
              function fromList(n, state) {
                // nothing buffered
                if (state.length === 0) return null;
                var ret;
                if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
                  // read it all, truncate the list
                  if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
                  state.buffer.clear();
                } else {
                  // read part of list
                  ret = fromListPartial(n, state.buffer, state.decoder);
                }
                return ret;
              } // Extracts only enough buffered data to satisfy the amount requested.
              // This function is designed to be inlinable, so please take care when making
              // changes to the function body.
    
    
              function fromListPartial(n, list, hasStrings) {
                var ret;
    
                if (n < list.head.data.length) {
                  // slice is the same for buffers and strings
                  ret = list.head.data.slice(0, n);
                  list.head.data = list.head.data.slice(n);
                } else if (n === list.head.data.length) {
                  // first chunk is a perfect match
                  ret = list.shift();
                } else {
                  // result spans more than one buffer
                  ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
                }
    
                return ret;
              } // Copies a specified amount of characters from the list of buffered data
              // chunks.
              // This function is designed to be inlinable, so please take care when making
              // changes to the function body.
    
    
              function copyFromBufferString(n, list) {
                var p = list.head;
                var c = 1;
                var ret = p.data;
                n -= ret.length;
    
                while (p = p.next) {
                  var str = p.data;
                  var nb = n > str.length ? str.length : n;
                  if (nb === str.length) ret += str;else ret += str.slice(0, n);
                  n -= nb;
    
                  if (n === 0) {
                    if (nb === str.length) {
                      ++c;
                      if (p.next) list.head = p.next;else list.head = list.tail = null;
                    } else {
                      list.head = p;
                      p.data = str.slice(nb);
                    }
    
                    break;
                  }
    
                  ++c;
                }
    
                list.length -= c;
                return ret;
              } // Copies a specified amount of bytes from the list of buffered data chunks.
              // This function is designed to be inlinable, so please take care when making
              // changes to the function body.
    
    
              function copyFromBuffer(n, list) {
                var ret = Buffer.allocUnsafe(n);
                var p = list.head;
                var c = 1;
                p.data.copy(ret);
                n -= p.data.length;
    
                while (p = p.next) {
                  var buf = p.data;
                  var nb = n > buf.length ? buf.length : n;
                  buf.copy(ret, ret.length - n, 0, nb);
                  n -= nb;
    
                  if (n === 0) {
                    if (nb === buf.length) {
                      ++c;
                      if (p.next) list.head = p.next;else list.head = list.tail = null;
                    } else {
                      list.head = p;
                      p.data = buf.slice(nb);
                    }
    
                    break;
                  }
    
                  ++c;
                }
    
                list.length -= c;
                return ret;
              }
    
              function endReadable(stream) {
                var state = stream._readableState; // If we get here before consuming all the bytes, then that is a
                // bug in node.  Should never happen.
    
                if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');
    
                if (!state.endEmitted) {
                  state.ended = true;
                  processNextTick(endReadableNT, state, stream);
                }
              }
    
              function endReadableNT(state, stream) {
                // Check that we didn't get one last unshift.
                if (!state.endEmitted && state.length === 0) {
                  state.endEmitted = true;
                  stream.readable = false;
                  stream.emit('end');
                }
              }
    
              function forEach(xs, f) {
                for (var i = 0, l = xs.length; i < l; i++) {
                  f(xs[i], i);
                }
              }
    
              function indexOf(xs, x) {
                for (var i = 0, l = xs.length; i < l; i++) {
                  if (xs[i] === x) return i;
                }
    
                return -1;
              }
            }).call(this);
          }).call(this, require('_process'), typeof __webpack_require__.g !== "undefined" ? __webpack_require__.g : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
        }, {
          "./_stream_duplex": 25,
          "./internal/streams/BufferList": 30,
          "./internal/streams/destroy": 31,
          "./internal/streams/stream": 32,
          "_process": 24,
          "core-util-is": 13,
          "events": 16,
          "inherits": 19,
          "isarray": 21,
          "process-nextick-args": 23,
          "safe-buffer": 33,
          "string_decoder/": 34,
          "util": 11
        }],
        28: [function (require, module, exports) {
          // Copyright Joyent, Inc. and other Node contributors.
          //
          // Permission is hereby granted, free of charge, to any person obtaining a
          // copy of this software and associated documentation files (the
          // "Software"), to deal in the Software without restriction, including
          // without limitation the rights to use, copy, modify, merge, publish,
          // distribute, sublicense, and/or sell copies of the Software, and to permit
          // persons to whom the Software is furnished to do so, subject to the
          // following conditions:
          //
          // The above copyright notice and this permission notice shall be included
          // in all copies or substantial portions of the Software.
          //
          // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
          // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
          // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
          // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
          // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
          // USE OR OTHER DEALINGS IN THE SOFTWARE.
          // a transform stream is a readable/writable stream where you do
          // something with the data.  Sometimes it's called a "filter",
          // but that's not a great name for it, since that implies a thing where
          // some bits pass through, and others are simply ignored.  (That would
          // be a valid example of a transform, of course.)
          //
          // While the output is causally related to the input, it's not a
          // necessarily symmetric or synchronous transformation.  For example,
          // a zlib stream might take multiple plain-text writes(), and then
          // emit a single compressed chunk some time in the future.
          //
          // Here's how this works:
          //
          // The Transform stream has all the aspects of the readable and writable
          // stream classes.  When you write(chunk), that calls _write(chunk,cb)
          // internally, and returns false if there's a lot of pending writes
          // buffered up.  When you call read(), that calls _read(n) until
          // there's enough pending readable data buffered up.
          //
          // In a transform stream, the written data is placed in a buffer.  When
          // _read(n) is called, it transforms the queued up data, calling the
          // buffered _write cb's as it consumes chunks.  If consuming a single
          // written chunk would result in multiple output chunks, then the first
          // outputted bit calls the readcb, and subsequent chunks just go into
          // the read buffer, and will cause it to emit 'readable' if necessary.
          //
          // This way, back-pressure is actually determined by the reading side,
          // since _read has to be called to start processing a new chunk.  However,
          // a pathological inflate type of transform can cause excessive buffering
          // here.  For example, imagine a stream where every byte of input is
          // interpreted as an integer from 0-255, and then results in that many
          // bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
          // 1kb of data being output.  In this case, you could write a very small
          // amount of input, and end up with a very large amount of output.  In
          // such a pathological inflating mechanism, there'd be no way to tell
          // the system to stop doing the transform.  A single 4MB write could
          // cause the system to run out of memory.
          //
          // However, even in such a pathological case, only a single written chunk
          // would be consumed, and then the rest would wait (un-transformed) until
          // the results of the previous transformed chunk were consumed.
          'use strict';
    
          module.exports = Transform;
    
          var Duplex = require('./_stream_duplex');
          /*<replacement>*/
    
    
          var util = require('core-util-is');
    
          util.inherits = require('inherits');
          /*</replacement>*/
    
          util.inherits(Transform, Duplex);
    
          function TransformState(stream) {
            this.afterTransform = function (er, data) {
              return afterTransform(stream, er, data);
            };
    
            this.needTransform = false;
            this.transforming = false;
            this.writecb = null;
            this.writechunk = null;
            this.writeencoding = null;
          }
    
          function afterTransform(stream, er, data) {
            var ts = stream._transformState;
            ts.transforming = false;
            var cb = ts.writecb;
    
            if (!cb) {
              return stream.emit('error', new Error('write callback called multiple times'));
            }
    
            ts.writechunk = null;
            ts.writecb = null;
            if (data !== null && data !== undefined) stream.push(data);
            cb(er);
            var rs = stream._readableState;
            rs.reading = false;
    
            if (rs.needReadable || rs.length < rs.highWaterMark) {
              stream._read(rs.highWaterMark);
            }
          }
    
          function Transform(options) {
            if (!(this instanceof Transform)) return new Transform(options);
            Duplex.call(this, options);
            this._transformState = new TransformState(this);
            var stream = this; // start out asking for a readable event once data is transformed.
    
            this._readableState.needReadable = true; // we have implemented the _read method, and done the other things
            // that Readable wants before the first _read call, so unset the
            // sync guard flag.
    
            this._readableState.sync = false;
    
            if (options) {
              if (typeof options.transform === 'function') this._transform = options.transform;
              if (typeof options.flush === 'function') this._flush = options.flush;
            } // When the writable side finishes, then flush out anything remaining.
    
    
            this.once('prefinish', function () {
              if (typeof this._flush === 'function') this._flush(function (er, data) {
                done(stream, er, data);
              });else done(stream);
            });
          }
    
          Transform.prototype.push = function (chunk, encoding) {
            this._transformState.needTransform = false;
            return Duplex.prototype.push.call(this, chunk, encoding);
          }; // This is the part where you do stuff!
          // override this function in implementation classes.
          // 'chunk' is an input chunk.
          //
          // Call `push(newChunk)` to pass along transformed output
          // to the readable side.  You may call 'push' zero or more times.
          //
          // Call `cb(err)` when you are done with this chunk.  If you pass
          // an error, then that'll put the hurt on the whole operation.  If you
          // never call cb(), then you'll never get another chunk.
    
    
          Transform.prototype._transform = function (chunk, encoding, cb) {
            throw new Error('_transform() is not implemented');
          };
    
          Transform.prototype._write = function (chunk, encoding, cb) {
            var ts = this._transformState;
            ts.writecb = cb;
            ts.writechunk = chunk;
            ts.writeencoding = encoding;
    
            if (!ts.transforming) {
              var rs = this._readableState;
              if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
            }
          }; // Doesn't matter what the args are here.
          // _transform does all the work.
          // That we got here means that the readable side wants more data.
    
    
          Transform.prototype._read = function (n) {
            var ts = this._transformState;
    
            if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
              ts.transforming = true;
    
              this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
            } else {
              // mark that we need a transform, so that any data that comes in
              // will get processed, now that we've asked for it.
              ts.needTransform = true;
            }
          };
    
          Transform.prototype._destroy = function (err, cb) {
            var _this = this;
    
            Duplex.prototype._destroy.call(this, err, function (err2) {
              cb(err2);
    
              _this.emit('close');
            });
          };
    
          function done(stream, er, data) {
            if (er) return stream.emit('error', er);
            if (data !== null && data !== undefined) stream.push(data); // if there's nothing in the write buffer, then that means
            // that nothing more will ever be provided
    
            var ws = stream._writableState;
            var ts = stream._transformState;
            if (ws.length) throw new Error('Calling transform done when ws.length != 0');
            if (ts.transforming) throw new Error('Calling transform done when still transforming');
            return stream.push(null);
          }
        }, {
          "./_stream_duplex": 25,
          "core-util-is": 13,
          "inherits": 19
        }],
        29: [function (require, module, exports) {
          (function (process, global, setImmediate) {
            (function () {
              // Copyright Joyent, Inc. and other Node contributors.
              //
              // Permission is hereby granted, free of charge, to any person obtaining a
              // copy of this software and associated documentation files (the
              // "Software"), to deal in the Software without restriction, including
              // without limitation the rights to use, copy, modify, merge, publish,
              // distribute, sublicense, and/or sell copies of the Software, and to permit
              // persons to whom the Software is furnished to do so, subject to the
              // following conditions:
              //
              // The above copyright notice and this permission notice shall be included
              // in all copies or substantial portions of the Software.
              //
              // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
              // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
              // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
              // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
              // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
              // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
              // USE OR OTHER DEALINGS IN THE SOFTWARE.
              // A bit simpler than readable streams.
              // Implement an async ._write(chunk, encoding, cb), and it'll handle all
              // the drain event emission and buffering.
              'use strict';
              /*<replacement>*/
    
              var processNextTick = require('process-nextick-args');
              /*</replacement>*/
    
    
              module.exports = Writable;
              /* <replacement> */
    
              function WriteReq(chunk, encoding, cb) {
                this.chunk = chunk;
                this.encoding = encoding;
                this.callback = cb;
                this.next = null;
              } // It seems a linked list but it is not
              // there will be only 2 of these for each stream
    
    
              function CorkedRequest(state) {
                var _this = this;
    
                this.next = null;
                this.entry = null;
    
                this.finish = function () {
                  onCorkedFinish(_this, state);
                };
              }
              /* </replacement> */
    
              /*<replacement>*/
    
    
              var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;
              /*</replacement>*/
    
              /*<replacement>*/
    
              var Duplex;
              /*</replacement>*/
    
              Writable.WritableState = WritableState;
              /*<replacement>*/
    
              var util = require('core-util-is');
    
              util.inherits = require('inherits');
              /*</replacement>*/
    
              /*<replacement>*/
    
              var internalUtil = {
                deprecate: require('util-deprecate')
              };
              /*</replacement>*/
    
              /*<replacement>*/
    
              var Stream = require('./internal/streams/stream');
              /*</replacement>*/
    
              /*<replacement>*/
    
    
              var Buffer = require('safe-buffer').Buffer;
    
              var OurUint8Array = global.Uint8Array || function () {};
    
              function _uint8ArrayToBuffer(chunk) {
                return Buffer.from(chunk);
              }
    
              function _isUint8Array(obj) {
                return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
              }
              /*</replacement>*/
    
    
              var destroyImpl = require('./internal/streams/destroy');
    
              util.inherits(Writable, Stream);
    
              function nop() {}
    
              function WritableState(options, stream) {
                Duplex = Duplex || require('./_stream_duplex');
                options = options || {}; // object stream flag to indicate whether or not this stream
                // contains buffers or objects.
    
                this.objectMode = !!options.objectMode;
                if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode; // the point at which write() starts returning false
                // Note: 0 is a valid value, means that we always return false if
                // the entire buffer is not flushed immediately on write()
    
                var hwm = options.highWaterMark;
                var defaultHwm = this.objectMode ? 16 : 16 * 1024;
                this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm; // cast to ints.
    
                this.highWaterMark = Math.floor(this.highWaterMark); // if _final has been called
    
                this.finalCalled = false; // drain event flag.
    
                this.needDrain = false; // at the start of calling end()
    
                this.ending = false; // when end() has been called, and returned
    
                this.ended = false; // when 'finish' is emitted
    
                this.finished = false; // has it been destroyed
    
                this.destroyed = false; // should we decode strings into buffers before passing to _write?
                // this is here so that some node-core streams can optimize string
                // handling at a lower level.
    
                var noDecode = options.decodeStrings === false;
                this.decodeStrings = !noDecode; // Crypto is kind of old and crusty.  Historically, its default string
                // encoding is 'binary' so we have to make this configurable.
                // Everything else in the universe uses 'utf8', though.
    
                this.defaultEncoding = options.defaultEncoding || 'utf8'; // not an actual buffer we keep track of, but a measurement
                // of how much we're waiting to get pushed to some underlying
                // socket or file.
    
                this.length = 0; // a flag to see when we're in the middle of a write.
    
                this.writing = false; // when true all writes will be buffered until .uncork() call
    
                this.corked = 0; // a flag to be able to tell if the onwrite cb is called immediately,
                // or on a later tick.  We set this to true at first, because any
                // actions that shouldn't happen until "later" should generally also
                // not happen before the first write call.
    
                this.sync = true; // a flag to know if we're processing previously buffered items, which
                // may call the _write() callback in the same tick, so that we don't
                // end up in an overlapped onwrite situation.
    
                this.bufferProcessing = false; // the callback that's passed to _write(chunk,cb)
    
                this.onwrite = function (er) {
                  onwrite(stream, er);
                }; // the callback that the user supplies to write(chunk,encoding,cb)
    
    
                this.writecb = null; // the amount that is being written when _write is called.
    
                this.writelen = 0;
                this.bufferedRequest = null;
                this.lastBufferedRequest = null; // number of pending user-supplied write callbacks
                // this must be 0 before 'finish' can be emitted
    
                this.pendingcb = 0; // emit prefinish if the only thing we're waiting for is _write cbs
                // This is relevant for synchronous Transform streams
    
                this.prefinished = false; // True if the error was already emitted and should not be thrown again
    
                this.errorEmitted = false; // count buffered requests
    
                this.bufferedRequestCount = 0; // allocate the first CorkedRequest, there is always
                // one allocated and free to use, and we maintain at most two
    
                this.corkedRequestsFree = new CorkedRequest(this);
              }
    
              WritableState.prototype.getBuffer = function getBuffer() {
                var current = this.bufferedRequest;
                var out = [];
    
                while (current) {
                  out.push(current);
                  current = current.next;
                }
    
                return out;
              };
    
              (function () {
                try {
                  Object.defineProperty(WritableState.prototype, 'buffer', {
                    get: internalUtil.deprecate(function () {
                      return this.getBuffer();
                    }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
                  });
                } catch (_) {}
              })(); // Test _writableState for inheritance to account for Duplex streams,
              // whose prototype chain only points to Readable.
    
    
              var realHasInstance;
    
              if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
                realHasInstance = Function.prototype[Symbol.hasInstance];
                Object.defineProperty(Writable, Symbol.hasInstance, {
                  value: function (object) {
                    if (realHasInstance.call(this, object)) return true;
                    return object && object._writableState instanceof WritableState;
                  }
                });
              } else {
                realHasInstance = function (object) {
                  return object instanceof this;
                };
              }
    
              function Writable(options) {
                Duplex = Duplex || require('./_stream_duplex'); // Writable ctor is applied to Duplexes, too.
                // `realHasInstance` is necessary because using plain `instanceof`
                // would return false, as no `_writableState` property is attached.
                // Trying to use the custom `instanceof` for Writable here will also break the
                // Node.js LazyTransform implementation, which has a non-trivial getter for
                // `_writableState` that would lead to infinite recursion.
    
                if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
                  return new Writable(options);
                }
    
                this._writableState = new WritableState(options, this); // legacy.
    
                this.writable = true;
    
                if (options) {
                  if (typeof options.write === 'function') this._write = options.write;
                  if (typeof options.writev === 'function') this._writev = options.writev;
                  if (typeof options.destroy === 'function') this._destroy = options.destroy;
                  if (typeof options.final === 'function') this._final = options.final;
                }
    
                Stream.call(this);
              } // Otherwise people can pipe Writable streams, which is just wrong.
    
    
              Writable.prototype.pipe = function () {
                this.emit('error', new Error('Cannot pipe, not readable'));
              };
    
              function writeAfterEnd(stream, cb) {
                var er = new Error('write after end'); // TODO: defer error events consistently everywhere, not just the cb
    
                stream.emit('error', er);
                processNextTick(cb, er);
              } // Checks that a user-supplied chunk is valid, especially for the particular
              // mode the stream is in. Currently this means that `null` is never accepted
              // and undefined/non-string values are only allowed in object mode.
    
    
              function validChunk(stream, state, chunk, cb) {
                var valid = true;
                var er = false;
    
                if (chunk === null) {
                  er = new TypeError('May not write null values to stream');
                } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
                  er = new TypeError('Invalid non-string/buffer chunk');
                }
    
                if (er) {
                  stream.emit('error', er);
                  processNextTick(cb, er);
                  valid = false;
                }
    
                return valid;
              }
    
              Writable.prototype.write = function (chunk, encoding, cb) {
                var state = this._writableState;
                var ret = false;
                var isBuf = _isUint8Array(chunk) && !state.objectMode;
    
                if (isBuf && !Buffer.isBuffer(chunk)) {
                  chunk = _uint8ArrayToBuffer(chunk);
                }
    
                if (typeof encoding === 'function') {
                  cb = encoding;
                  encoding = null;
                }
    
                if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;
                if (typeof cb !== 'function') cb = nop;
                if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
                  state.pendingcb++;
                  ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
                }
                return ret;
              };
    
              Writable.prototype.cork = function () {
                var state = this._writableState;
                state.corked++;
              };
    
              Writable.prototype.uncork = function () {
                var state = this._writableState;
    
                if (state.corked) {
                  state.corked--;
                  if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
                }
              };
    
              Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
                // node::ParseEncoding() requires lower case.
                if (typeof encoding === 'string') encoding = encoding.toLowerCase();
                if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
                this._writableState.defaultEncoding = encoding;
                return this;
              };
    
              function decodeChunk(state, chunk, encoding) {
                if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
                  chunk = Buffer.from(chunk, encoding);
                }
    
                return chunk;
              } // if we're already writing something, then just put this
              // in the queue, and wait our turn.  Otherwise, call _write
              // If we return false, then we need a drain event, so set that flag.
    
    
              function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
                if (!isBuf) {
                  var newChunk = decodeChunk(state, chunk, encoding);
    
                  if (chunk !== newChunk) {
                    isBuf = true;
                    encoding = 'buffer';
                    chunk = newChunk;
                  }
                }
    
                var len = state.objectMode ? 1 : chunk.length;
                state.length += len;
                var ret = state.length < state.highWaterMark; // we must ensure that previous needDrain will not be reset to false.
    
                if (!ret) state.needDrain = true;
    
                if (state.writing || state.corked) {
                  var last = state.lastBufferedRequest;
                  state.lastBufferedRequest = {
                    chunk: chunk,
                    encoding: encoding,
                    isBuf: isBuf,
                    callback: cb,
                    next: null
                  };
    
                  if (last) {
                    last.next = state.lastBufferedRequest;
                  } else {
                    state.bufferedRequest = state.lastBufferedRequest;
                  }
    
                  state.bufferedRequestCount += 1;
                } else {
                  doWrite(stream, state, false, len, chunk, encoding, cb);
                }
    
                return ret;
              }
    
              function doWrite(stream, state, writev, len, chunk, encoding, cb) {
                state.writelen = len;
                state.writecb = cb;
                state.writing = true;
                state.sync = true;
                if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
                state.sync = false;
              }
    
              function onwriteError(stream, state, sync, er, cb) {
                --state.pendingcb;
    
                if (sync) {
                  // defer the callback if we are being called synchronously
                  // to avoid piling up things on the stack
                  processNextTick(cb, er); // this can emit finish, and it will always happen
                  // after error
    
                  processNextTick(finishMaybe, stream, state);
                  stream._writableState.errorEmitted = true;
                  stream.emit('error', er);
                } else {
                  // the caller expect this to happen before if
                  // it is async
                  cb(er);
                  stream._writableState.errorEmitted = true;
                  stream.emit('error', er); // this can emit finish, but finish must
                  // always follow error
    
                  finishMaybe(stream, state);
                }
              }
    
              function onwriteStateUpdate(state) {
                state.writing = false;
                state.writecb = null;
                state.length -= state.writelen;
                state.writelen = 0;
              }
    
              function onwrite(stream, er) {
                var state = stream._writableState;
                var sync = state.sync;
                var cb = state.writecb;
                onwriteStateUpdate(state);
                if (er) onwriteError(stream, state, sync, er, cb);else {
                  // Check if we're actually ready to finish, but don't emit yet
                  var finished = needFinish(state);
    
                  if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
                    clearBuffer(stream, state);
                  }
    
                  if (sync) {
                    /*<replacement>*/
                    asyncWrite(afterWrite, stream, state, finished, cb);
                    /*</replacement>*/
                  } else {
                    afterWrite(stream, state, finished, cb);
                  }
                }
              }
    
              function afterWrite(stream, state, finished, cb) {
                if (!finished) onwriteDrain(stream, state);
                state.pendingcb--;
                cb();
                finishMaybe(stream, state);
              } // Must force callback to be called on nextTick, so that we don't
              // emit 'drain' before the write() consumer gets the 'false' return
              // value, and has a chance to attach a 'drain' listener.
    
    
              function onwriteDrain(stream, state) {
                if (state.length === 0 && state.needDrain) {
                  state.needDrain = false;
                  stream.emit('drain');
                }
              } // if there's something in the buffer waiting, then process it
    
    
              function clearBuffer(stream, state) {
                state.bufferProcessing = true;
                var entry = state.bufferedRequest;
    
                if (stream._writev && entry && entry.next) {
                  // Fast case, write everything using _writev()
                  var l = state.bufferedRequestCount;
                  var buffer = new Array(l);
                  var holder = state.corkedRequestsFree;
                  holder.entry = entry;
                  var count = 0;
                  var allBuffers = true;
    
                  while (entry) {
                    buffer[count] = entry;
                    if (!entry.isBuf) allBuffers = false;
                    entry = entry.next;
                    count += 1;
                  }
    
                  buffer.allBuffers = allBuffers;
                  doWrite(stream, state, true, state.length, buffer, '', holder.finish); // doWrite is almost always async, defer these to save a bit of time
                  // as the hot path ends with doWrite
    
                  state.pendingcb++;
                  state.lastBufferedRequest = null;
    
                  if (holder.next) {
                    state.corkedRequestsFree = holder.next;
                    holder.next = null;
                  } else {
                    state.corkedRequestsFree = new CorkedRequest(state);
                  }
                } else {
                  // Slow case, write chunks one-by-one
                  while (entry) {
                    var chunk = entry.chunk;
                    var encoding = entry.encoding;
                    var cb = entry.callback;
                    var len = state.objectMode ? 1 : chunk.length;
                    doWrite(stream, state, false, len, chunk, encoding, cb);
                    entry = entry.next; // if we didn't call the onwrite immediately, then
                    // it means that we need to wait until it does.
                    // also, that means that the chunk and cb are currently
                    // being processed, so move the buffer counter past them.
    
                    if (state.writing) {
                      break;
                    }
                  }
    
                  if (entry === null) state.lastBufferedRequest = null;
                }
    
                state.bufferedRequestCount = 0;
                state.bufferedRequest = entry;
                state.bufferProcessing = false;
              }
    
              Writable.prototype._write = function (chunk, encoding, cb) {
                cb(new Error('_write() is not implemented'));
              };
    
              Writable.prototype._writev = null;
    
              Writable.prototype.end = function (chunk, encoding, cb) {
                var state = this._writableState;
    
                if (typeof chunk === 'function') {
                  cb = chunk;
                  chunk = null;
                  encoding = null;
                } else if (typeof encoding === 'function') {
                  cb = encoding;
                  encoding = null;
                }
    
                if (chunk !== null && chunk !== undefined) this.write(chunk, encoding); // .end() fully uncorks
    
                if (state.corked) {
                  state.corked = 1;
                  this.uncork();
                } // ignore unnecessary end() calls.
    
    
                if (!state.ending && !state.finished) endWritable(this, state, cb);
              };
    
              function needFinish(state) {
                return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
              }
    
              function callFinal(stream, state) {
                stream._final(function (err) {
                  state.pendingcb--;
    
                  if (err) {
                    stream.emit('error', err);
                  }
    
                  state.prefinished = true;
                  stream.emit('prefinish');
                  finishMaybe(stream, state);
                });
              }
    
              function prefinish(stream, state) {
                if (!state.prefinished && !state.finalCalled) {
                  if (typeof stream._final === 'function') {
                    state.pendingcb++;
                    state.finalCalled = true;
                    processNextTick(callFinal, stream, state);
                  } else {
                    state.prefinished = true;
                    stream.emit('prefinish');
                  }
                }
              }
    
              function finishMaybe(stream, state) {
                var need = needFinish(state);
    
                if (need) {
                  prefinish(stream, state);
    
                  if (state.pendingcb === 0) {
                    state.finished = true;
                    stream.emit('finish');
                  }
                }
    
                return need;
              }
    
              function endWritable(stream, state, cb) {
                state.ending = true;
                finishMaybe(stream, state);
    
                if (cb) {
                  if (state.finished) processNextTick(cb);else stream.once('finish', cb);
                }
    
                state.ended = true;
                stream.writable = false;
              }
    
              function onCorkedFinish(corkReq, state, err) {
                var entry = corkReq.entry;
                corkReq.entry = null;
    
                while (entry) {
                  var cb = entry.callback;
                  state.pendingcb--;
                  cb(err);
                  entry = entry.next;
                }
    
                if (state.corkedRequestsFree) {
                  state.corkedRequestsFree.next = corkReq;
                } else {
                  state.corkedRequestsFree = corkReq;
                }
              }
    
              Object.defineProperty(Writable.prototype, 'destroyed', {
                get: function () {
                  if (this._writableState === undefined) {
                    return false;
                  }
    
                  return this._writableState.destroyed;
                },
                set: function (value) {
                  // we ignore the value if the stream
                  // has not been initialized yet
                  if (!this._writableState) {
                    return;
                  } // backward compatibility, the user is explicitly
                  // managing destroyed
    
    
                  this._writableState.destroyed = value;
                }
              });
              Writable.prototype.destroy = destroyImpl.destroy;
              Writable.prototype._undestroy = destroyImpl.undestroy;
    
              Writable.prototype._destroy = function (err, cb) {
                this.end();
                cb(err);
              };
            }).call(this);
          }).call(this, require('_process'), typeof __webpack_require__.g !== "undefined" ? __webpack_require__.g : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("timers").setImmediate);
        }, {
          "./_stream_duplex": 25,
          "./internal/streams/destroy": 31,
          "./internal/streams/stream": 32,
          "_process": 24,
          "core-util-is": 13,
          "inherits": 19,
          "process-nextick-args": 23,
          "safe-buffer": 33,
          "timers": 37,
          "util-deprecate": 38
        }],
        30: [function (require, module, exports) {
          'use strict';
          /*<replacement>*/
    
          function _classCallCheck(instance, Constructor) {
            if (!(instance instanceof Constructor)) {
              throw new TypeError("Cannot call a class as a function");
            }
          }
    
          var Buffer = require('safe-buffer').Buffer;
          /*</replacement>*/
    
    
          function copyBuffer(src, target, offset) {
            src.copy(target, offset);
          }
    
          module.exports = function () {
            function BufferList() {
              _classCallCheck(this, BufferList);
    
              this.head = null;
              this.tail = null;
              this.length = 0;
            }
    
            BufferList.prototype.push = function push(v) {
              var entry = {
                data: v,
                next: null
              };
              if (this.length > 0) this.tail.next = entry;else this.head = entry;
              this.tail = entry;
              ++this.length;
            };
    
            BufferList.prototype.unshift = function unshift(v) {
              var entry = {
                data: v,
                next: this.head
              };
              if (this.length === 0) this.tail = entry;
              this.head = entry;
              ++this.length;
            };
    
            BufferList.prototype.shift = function shift() {
              if (this.length === 0) return;
              var ret = this.head.data;
              if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
              --this.length;
              return ret;
            };
    
            BufferList.prototype.clear = function clear() {
              this.head = this.tail = null;
              this.length = 0;
            };
    
            BufferList.prototype.join = function join(s) {
              if (this.length === 0) return '';
              var p = this.head;
              var ret = '' + p.data;
    
              while (p = p.next) {
                ret += s + p.data;
              }
    
              return ret;
            };
    
            BufferList.prototype.concat = function concat(n) {
              if (this.length === 0) return Buffer.alloc(0);
              if (this.length === 1) return this.head.data;
              var ret = Buffer.allocUnsafe(n >>> 0);
              var p = this.head;
              var i = 0;
    
              while (p) {
                copyBuffer(p.data, ret, i);
                i += p.data.length;
                p = p.next;
              }
    
              return ret;
            };
    
            return BufferList;
          }();
        }, {
          "safe-buffer": 33
        }],
        31: [function (require, module, exports) {
          'use strict';
          /*<replacement>*/
    
          var processNextTick = require('process-nextick-args');
          /*</replacement>*/
          // undocumented cb() API, needed for core, not for public API
    
    
          function destroy(err, cb) {
            var _this = this;
    
            var readableDestroyed = this._readableState && this._readableState.destroyed;
            var writableDestroyed = this._writableState && this._writableState.destroyed;
    
            if (readableDestroyed || writableDestroyed) {
              if (cb) {
                cb(err);
              } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
                processNextTick(emitErrorNT, this, err);
              }
    
              return;
            } // we set destroyed to true before firing error callbacks in order
            // to make it re-entrance safe in case destroy() is called within callbacks
    
    
            if (this._readableState) {
              this._readableState.destroyed = true;
            } // if this is a duplex stream mark the writable part as destroyed as well
    
    
            if (this._writableState) {
              this._writableState.destroyed = true;
            }
    
            this._destroy(err || null, function (err) {
              if (!cb && err) {
                processNextTick(emitErrorNT, _this, err);
    
                if (_this._writableState) {
                  _this._writableState.errorEmitted = true;
                }
              } else if (cb) {
                cb(err);
              }
            });
          }
    
          function undestroy() {
            if (this._readableState) {
              this._readableState.destroyed = false;
              this._readableState.reading = false;
              this._readableState.ended = false;
              this._readableState.endEmitted = false;
            }
    
            if (this._writableState) {
              this._writableState.destroyed = false;
              this._writableState.ended = false;
              this._writableState.ending = false;
              this._writableState.finished = false;
              this._writableState.errorEmitted = false;
            }
          }
    
          function emitErrorNT(self, err) {
            self.emit('error', err);
          }
    
          module.exports = {
            destroy: destroy,
            undestroy: undestroy
          };
        }, {
          "process-nextick-args": 23
        }],
        32: [function (require, module, exports) {
          module.exports = require('events').EventEmitter;
        }, {
          "events": 16
        }],
        33: [function (require, module, exports) {
          /* eslint-disable node/no-deprecated-api */
          var buffer = require('buffer');
    
          var Buffer = buffer.Buffer; // alternative to using Object.keys for old browsers
    
          function copyProps(src, dst) {
            for (var key in src) {
              dst[key] = src[key];
            }
          }
    
          if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
            module.exports = buffer;
          } else {
            // Copy properties from require('buffer')
            copyProps(buffer, exports);
            exports.Buffer = SafeBuffer;
          }
    
          function SafeBuffer(arg, encodingOrOffset, length) {
            return Buffer(arg, encodingOrOffset, length);
          } // Copy static methods from Buffer
    
    
          copyProps(Buffer, SafeBuffer);
    
          SafeBuffer.from = function (arg, encodingOrOffset, length) {
            if (typeof arg === 'number') {
              throw new TypeError('Argument must not be a number');
            }
    
            return Buffer(arg, encodingOrOffset, length);
          };
    
          SafeBuffer.alloc = function (size, fill, encoding) {
            if (typeof size !== 'number') {
              throw new TypeError('Argument must be a number');
            }
    
            var buf = Buffer(size);
    
            if (fill !== undefined) {
              if (typeof encoding === 'string') {
                buf.fill(fill, encoding);
              } else {
                buf.fill(fill);
              }
            } else {
              buf.fill(0);
            }
    
            return buf;
          };
    
          SafeBuffer.allocUnsafe = function (size) {
            if (typeof size !== 'number') {
              throw new TypeError('Argument must be a number');
            }
    
            return Buffer(size);
          };
    
          SafeBuffer.allocUnsafeSlow = function (size) {
            if (typeof size !== 'number') {
              throw new TypeError('Argument must be a number');
            }
    
            return buffer.SlowBuffer(size);
          };
        }, {
          "buffer": 12
        }],
        34: [function (require, module, exports) {
          'use strict';
    
          var Buffer = require('safe-buffer').Buffer;
    
          var isEncoding = Buffer.isEncoding || function (encoding) {
            encoding = '' + encoding;
    
            switch (encoding && encoding.toLowerCase()) {
              case 'hex':
              case 'utf8':
              case 'utf-8':
              case 'ascii':
              case 'binary':
              case 'base64':
              case 'ucs2':
              case 'ucs-2':
              case 'utf16le':
              case 'utf-16le':
              case 'raw':
                return true;
    
              default:
                return false;
            }
          };
    
          function _normalizeEncoding(enc) {
            if (!enc) return 'utf8';
            var retried;
    
            while (true) {
              switch (enc) {
                case 'utf8':
                case 'utf-8':
                  return 'utf8';
    
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return 'utf16le';
    
                case 'latin1':
                case 'binary':
                  return 'latin1';
    
                case 'base64':
                case 'ascii':
                case 'hex':
                  return enc;
    
                default:
                  if (retried) return; // undefined
    
                  enc = ('' + enc).toLowerCase();
                  retried = true;
              }
            }
          }
    
          ; // Do not cache `Buffer.isEncoding` when checking encoding names as some
          // modules monkey-patch it to support additional encodings
    
          function normalizeEncoding(enc) {
            var nenc = _normalizeEncoding(enc);
    
            if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
            return nenc || enc;
          } // StringDecoder provides an interface for efficiently splitting a series of
          // buffers into a series of JS strings without breaking apart multi-byte
          // characters.
    
    
          exports.StringDecoder = StringDecoder;
    
          function StringDecoder(encoding) {
            this.encoding = normalizeEncoding(encoding);
            var nb;
    
            switch (this.encoding) {
              case 'utf16le':
                this.text = utf16Text;
                this.end = utf16End;
                nb = 4;
                break;
    
              case 'utf8':
                this.fillLast = utf8FillLast;
                nb = 4;
                break;
    
              case 'base64':
                this.text = base64Text;
                this.end = base64End;
                nb = 3;
                break;
    
              default:
                this.write = simpleWrite;
                this.end = simpleEnd;
                return;
            }
    
            this.lastNeed = 0;
            this.lastTotal = 0;
            this.lastChar = Buffer.allocUnsafe(nb);
          }
    
          StringDecoder.prototype.write = function (buf) {
            if (buf.length === 0) return '';
            var r;
            var i;
    
            if (this.lastNeed) {
              r = this.fillLast(buf);
              if (r === undefined) return '';
              i = this.lastNeed;
              this.lastNeed = 0;
            } else {
              i = 0;
            }
    
            if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
            return r || '';
          };
    
          StringDecoder.prototype.end = utf8End; // Returns only complete characters in a Buffer
    
          StringDecoder.prototype.text = utf8Text; // Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
    
          StringDecoder.prototype.fillLast = function (buf) {
            if (this.lastNeed <= buf.length) {
              buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
              return this.lastChar.toString(this.encoding, 0, this.lastTotal);
            }
    
            buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
            this.lastNeed -= buf.length;
          }; // Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
          // continuation byte.
    
    
          function utf8CheckByte(byte) {
            if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
            return -1;
          } // Checks at most 3 bytes at the end of a Buffer in order to detect an
          // incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
          // needed to complete the UTF-8 character (if applicable) are returned.
    
    
          function utf8CheckIncomplete(self, buf, i) {
            var j = buf.length - 1;
            if (j < i) return 0;
            var nb = utf8CheckByte(buf[j]);
    
            if (nb >= 0) {
              if (nb > 0) self.lastNeed = nb - 1;
              return nb;
            }
    
            if (--j < i) return 0;
            nb = utf8CheckByte(buf[j]);
    
            if (nb >= 0) {
              if (nb > 0) self.lastNeed = nb - 2;
              return nb;
            }
    
            if (--j < i) return 0;
            nb = utf8CheckByte(buf[j]);
    
            if (nb >= 0) {
              if (nb > 0) {
                if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
              }
    
              return nb;
            }
    
            return 0;
          } // Validates as many continuation bytes for a multi-byte UTF-8 character as
          // needed or are available. If we see a non-continuation byte where we expect
          // one, we "replace" the validated continuation bytes we've seen so far with
          // UTF-8 replacement characters ('\ufffd'), to match v8's UTF-8 decoding
          // behavior. The continuation byte check is included three times in the case
          // where all of the continuation bytes for a character exist in the same buffer.
          // It is also done this way as a slight performance increase instead of using a
          // loop.
    
    
          function utf8CheckExtraBytes(self, buf, p) {
            if ((buf[0] & 0xC0) !== 0x80) {
              self.lastNeed = 0;
              return '\ufffd'.repeat(p);
            }
    
            if (self.lastNeed > 1 && buf.length > 1) {
              if ((buf[1] & 0xC0) !== 0x80) {
                self.lastNeed = 1;
                return '\ufffd'.repeat(p + 1);
              }
    
              if (self.lastNeed > 2 && buf.length > 2) {
                if ((buf[2] & 0xC0) !== 0x80) {
                  self.lastNeed = 2;
                  return '\ufffd'.repeat(p + 2);
                }
              }
            }
          } // Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
    
    
          function utf8FillLast(buf) {
            var p = this.lastTotal - this.lastNeed;
            var r = utf8CheckExtraBytes(this, buf, p);
            if (r !== undefined) return r;
    
            if (this.lastNeed <= buf.length) {
              buf.copy(this.lastChar, p, 0, this.lastNeed);
              return this.lastChar.toString(this.encoding, 0, this.lastTotal);
            }
    
            buf.copy(this.lastChar, p, 0, buf.length);
            this.lastNeed -= buf.length;
          } // Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
          // partial character, the character's bytes are buffered until the required
          // number of bytes are available.
    
    
          function utf8Text(buf, i) {
            var total = utf8CheckIncomplete(this, buf, i);
            if (!this.lastNeed) return buf.toString('utf8', i);
            this.lastTotal = total;
            var end = buf.length - (total - this.lastNeed);
            buf.copy(this.lastChar, 0, end);
            return buf.toString('utf8', i, end);
          } // For UTF-8, a replacement character for each buffered byte of a (partial)
          // character needs to be added to the output.
    
    
          function utf8End(buf) {
            var r = buf && buf.length ? this.write(buf) : '';
            if (this.lastNeed) return r + '\ufffd'.repeat(this.lastTotal - this.lastNeed);
            return r;
          } // UTF-16LE typically needs two bytes per character, but even if we have an even
          // number of bytes available, we need to check if we end on a leading/high
          // surrogate. In that case, we need to wait for the next two bytes in order to
          // decode the last character properly.
    
    
          function utf16Text(buf, i) {
            if ((buf.length - i) % 2 === 0) {
              var r = buf.toString('utf16le', i);
    
              if (r) {
                var c = r.charCodeAt(r.length - 1);
    
                if (c >= 0xD800 && c <= 0xDBFF) {
                  this.lastNeed = 2;
                  this.lastTotal = 4;
                  this.lastChar[0] = buf[buf.length - 2];
                  this.lastChar[1] = buf[buf.length - 1];
                  return r.slice(0, -1);
                }
              }
    
              return r;
            }
    
            this.lastNeed = 1;
            this.lastTotal = 2;
            this.lastChar[0] = buf[buf.length - 1];
            return buf.toString('utf16le', i, buf.length - 1);
          } // For UTF-16LE we do not explicitly append special replacement characters if we
          // end on a partial character, we simply let v8 handle that.
    
    
          function utf16End(buf) {
            var r = buf && buf.length ? this.write(buf) : '';
    
            if (this.lastNeed) {
              var end = this.lastTotal - this.lastNeed;
              return r + this.lastChar.toString('utf16le', 0, end);
            }
    
            return r;
          }
    
          function base64Text(buf, i) {
            var n = (buf.length - i) % 3;
            if (n === 0) return buf.toString('base64', i);
            this.lastNeed = 3 - n;
            this.lastTotal = 3;
    
            if (n === 1) {
              this.lastChar[0] = buf[buf.length - 1];
            } else {
              this.lastChar[0] = buf[buf.length - 2];
              this.lastChar[1] = buf[buf.length - 1];
            }
    
            return buf.toString('base64', i, buf.length - n);
          }
    
          function base64End(buf) {
            var r = buf && buf.length ? this.write(buf) : '';
            if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
            return r;
          } // Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
    
    
          function simpleWrite(buf) {
            return buf.toString(this.encoding);
          }
    
          function simpleEnd(buf) {
            return buf && buf.length ? this.write(buf) : '';
          }
        }, {
          "safe-buffer": 33
        }],
        35: [function (require, module, exports) {
          exports = module.exports = require('./lib/_stream_readable.js');
          exports.Stream = exports;
          exports.Readable = exports;
          exports.Writable = require('./lib/_stream_writable.js');
          exports.Duplex = require('./lib/_stream_duplex.js');
          exports.Transform = require('./lib/_stream_transform.js');
          exports.PassThrough = require('./lib/_stream_passthrough.js');
        }, {
          "./lib/_stream_duplex.js": 25,
          "./lib/_stream_passthrough.js": 26,
          "./lib/_stream_readable.js": 27,
          "./lib/_stream_transform.js": 28,
          "./lib/_stream_writable.js": 29
        }],
        36: [function (require, module, exports) {
          'use strict';
    
          Object.defineProperty(exports, '__esModule', {
            value: true
          });
          /**
           * A `StructFailure` represents a single specific failure in validation.
           */
    
          /**
           * `StructError` objects are thrown (or returned) when validation fails.
           *
           * Validation logic is design to exit early for maximum performance. The error
           * represents the first error encountered during validation. For more detail,
           * the `error.failures` property is a generator function that can be run to
           * continue validation and receive all the failures in the data.
           */
    
          class StructError extends TypeError {
            constructor(failure, failures) {
              let cached;
              const {
                message,
                ...rest
              } = failure;
              const {
                path
              } = failure;
              const msg = path.length === 0 ? message : "At path: " + path.join('.') + " -- " + message;
              super(msg);
              this.value = void 0;
              this.key = void 0;
              this.type = void 0;
              this.refinement = void 0;
              this.path = void 0;
              this.branch = void 0;
              this.failures = void 0;
              Object.assign(this, rest);
              this.name = this.constructor.name;
    
              this.failures = () => {
                var _cached;
    
                return (_cached = cached) != null ? _cached : cached = [failure, ...failures()];
              };
            }
    
          }
          /**
           * Check if a value is an iterator.
           */
    
    
          function isIterable(x) {
            return isObject(x) && typeof x[Symbol.iterator] === 'function';
          }
          /**
           * Check if a value is a plain object.
           */
    
    
          function isObject(x) {
            return typeof x === 'object' && x != null;
          }
          /**
           * Check if a value is a plain object.
           */
    
    
          function isPlainObject(x) {
            if (Object.prototype.toString.call(x) !== '[object Object]') {
              return false;
            }
    
            const prototype = Object.getPrototypeOf(x);
            return prototype === null || prototype === Object.prototype;
          }
          /**
           * Return a value as a printable string.
           */
    
    
          function print(value) {
            return typeof value === 'string' ? JSON.stringify(value) : "" + value;
          }
          /**
           * Shifts (removes and returns) the first value from the `input` iterator.
           * Like `Array.prototype.shift()` but for an `Iterator`.
           */
    
    
          function shiftIterator(input) {
            const {
              done,
              value
            } = input.next();
            return done ? undefined : value;
          }
          /**
           * Convert a single validation result to a failure.
           */
    
    
          function toFailure(result, context, struct, value) {
            if (result === true) {
              return;
            } else if (result === false) {
              result = {};
            } else if (typeof result === 'string') {
              result = {
                message: result
              };
            }
    
            const {
              path,
              branch
            } = context;
            const {
              type
            } = struct;
            const {
              refinement,
              message = "Expected a value of type `" + type + "`" + (refinement ? " with refinement `" + refinement + "`" : '') + ", but received: `" + print(value) + "`"
            } = result;
            return {
              value,
              type,
              refinement,
              key: path[path.length - 1],
              path,
              branch,
              ...result,
              message
            };
          }
          /**
           * Convert a validation result to an iterable of failures.
           */
    
    
          function* toFailures(result, context, struct, value) {
            if (!isIterable(result)) {
              result = [result];
            }
    
            for (const r of result) {
              const failure = toFailure(r, context, struct, value);
    
              if (failure) {
                yield failure;
              }
            }
          }
          /**
           * Check a value against a struct, traversing deeply into nested values, and
           * returning an iterator of failures or success.
           */
    
    
          function* run(value, struct, options) {
            if (options === void 0) {
              options = {};
            }
    
            const {
              path = [],
              branch = [value],
              coerce = false,
              mask = false
            } = options;
            const ctx = {
              path,
              branch
            };
    
            if (coerce) {
              value = struct.coercer(value, ctx);
    
              if (mask && struct.type !== 'type' && isObject(struct.schema) && isObject(value) && !Array.isArray(value)) {
                for (const key in value) {
                  if (struct.schema[key] === undefined) {
                    delete value[key];
                  }
                }
              }
            }
    
            let status = 'valid';
    
            for (const failure of struct.validator(value, ctx)) {
              status = 'not_valid';
              yield [failure, undefined];
            }
    
            for (let [k, v, s] of struct.entries(value, ctx)) {
              const ts = run(v, s, {
                path: k === undefined ? path : [...path, k],
                branch: k === undefined ? branch : [...branch, v],
                coerce,
                mask
              });
    
              for (const t of ts) {
                if (t[0]) {
                  status = t[0].refinement != null ? 'not_refined' : 'not_valid';
                  yield [t[0], undefined];
                } else if (coerce) {
                  v = t[1];
    
                  if (k === undefined) {
                    value = v;
                  } else if (value instanceof Map) {
                    value.set(k, v);
                  } else if (value instanceof Set) {
                    value.add(v);
                  } else if (isObject(value)) {
                    value[k] = v;
                  }
                }
              }
            }
    
            if (status !== 'not_valid') {
              for (const failure of struct.refiner(value, ctx)) {
                status = 'not_refined';
                yield [failure, undefined];
              }
            }
    
            if (status === 'valid') {
              yield [undefined, value];
            }
          }
          /**
           * `Struct` objects encapsulate the validation logic for a specific type of
           * values. Once constructed, you use the `assert`, `is` or `validate` helpers to
           * validate unknown input data against the struct.
           */
    
    
          class Struct {
            constructor(props) {
              this.TYPE = void 0;
              this.type = void 0;
              this.schema = void 0;
              this.coercer = void 0;
              this.validator = void 0;
              this.refiner = void 0;
              this.entries = void 0;
              const {
                type,
                schema,
                validator,
                refiner,
                coercer = value => value,
                entries = function* () {}
              } = props;
              this.type = type;
              this.schema = schema;
              this.entries = entries;
              this.coercer = coercer;
    
              if (validator) {
                this.validator = (value, context) => {
                  const result = validator(value, context);
                  return toFailures(result, context, this, value);
                };
              } else {
                this.validator = () => [];
              }
    
              if (refiner) {
                this.refiner = (value, context) => {
                  const result = refiner(value, context);
                  return toFailures(result, context, this, value);
                };
              } else {
                this.refiner = () => [];
              }
            }
            /**
             * Assert that a value passes the struct's validation, throwing if it doesn't.
             */
    
    
            assert(value) {
              return assert(value, this);
            }
            /**
             * Create a value with the struct's coercion logic, then validate it.
             */
    
    
            create(value) {
              return create(value, this);
            }
            /**
             * Check if a value passes the struct's validation.
             */
    
    
            is(value) {
              return is(value, this);
            }
            /**
             * Mask a value, coercing and validating it, but returning only the subset of
             * properties defined by the struct's schema.
             */
    
    
            mask(value) {
              return mask(value, this);
            }
            /**
             * Validate a value with the struct's validation logic, returning a tuple
             * representing the result.
             *
             * You may optionally pass `true` for the `withCoercion` argument to coerce
             * the value before attempting to validate it. If you do, the result will
             * contain the coerced result when successful.
             */
    
    
            validate(value, options) {
              if (options === void 0) {
                options = {};
              }
    
              return validate(value, this, options);
            }
    
          }
          /**
           * Assert that a value passes a struct, throwing if it doesn't.
           */
    
    
          function assert(value, struct) {
            const result = validate(value, struct);
    
            if (result[0]) {
              throw result[0];
            }
          }
          /**
           * Create a value with the coercion logic of struct and validate it.
           */
    
    
          function create(value, struct) {
            const result = validate(value, struct, {
              coerce: true
            });
    
            if (result[0]) {
              throw result[0];
            } else {
              return result[1];
            }
          }
          /**
           * Mask a value, returning only the subset of properties defined by a struct.
           */
    
    
          function mask(value, struct) {
            const result = validate(value, struct, {
              coerce: true,
              mask: true
            });
    
            if (result[0]) {
              throw result[0];
            } else {
              return result[1];
            }
          }
          /**
           * Check if a value passes a struct.
           */
    
    
          function is(value, struct) {
            const result = validate(value, struct);
            return !result[0];
          }
          /**
           * Validate a value against a struct, returning an error if invalid, or the
           * value (with potential coercion) if valid.
           */
    
    
          function validate(value, struct, options) {
            if (options === void 0) {
              options = {};
            }
    
            const tuples = run(value, struct, options);
            const tuple = shiftIterator(tuples);
    
            if (tuple[0]) {
              const error = new StructError(tuple[0], function* () {
                for (const t of tuples) {
                  if (t[0]) {
                    yield t[0];
                  }
                }
              });
              return [error, undefined];
            } else {
              const v = tuple[1];
              return [undefined, v];
            }
          }
    
          function assign() {
            for (var _len = arguments.length, Structs = new Array(_len), _key = 0; _key < _len; _key++) {
              Structs[_key] = arguments[_key];
            }
    
            const isType = Structs[0].type === 'type';
            const schemas = Structs.map(s => s.schema);
            const schema = Object.assign({}, ...schemas);
            return isType ? type(schema) : object(schema);
          }
          /**
           * Define a new struct type with a custom validation function.
           */
    
    
          function define(name, validator) {
            return new Struct({
              type: name,
              schema: null,
              validator
            });
          }
          /**
           * Create a new struct based on an existing struct, but the value is allowed to
           * be `undefined`. `log` will be called if the value is not `undefined`.
           */
    
    
          function deprecated(struct, log) {
            return new Struct({ ...struct,
              refiner: (value, ctx) => value === undefined || struct.refiner(value, ctx),
    
              validator(value, ctx) {
                if (value === undefined) {
                  return true;
                } else {
                  log(value, ctx);
                  return struct.validator(value, ctx);
                }
              }
    
            });
          }
          /**
           * Create a struct with dynamic validation logic.
           *
           * The callback will receive the value currently being validated, and must
           * return a struct object to validate it with. This can be useful to model
           * validation logic that changes based on its input.
           */
    
    
          function dynamic(fn) {
            return new Struct({
              type: 'dynamic',
              schema: null,
    
              *entries(value, ctx) {
                const struct = fn(value, ctx);
                yield* struct.entries(value, ctx);
              },
    
              validator(value, ctx) {
                const struct = fn(value, ctx);
                return struct.validator(value, ctx);
              },
    
              coercer(value, ctx) {
                const struct = fn(value, ctx);
                return struct.coercer(value, ctx);
              },
    
              refiner(value, ctx) {
                const struct = fn(value, ctx);
                return struct.refiner(value, ctx);
              }
    
            });
          }
          /**
           * Create a struct with lazily evaluated validation logic.
           *
           * The first time validation is run with the struct, the callback will be called
           * and must return a struct object to use. This is useful for cases where you
           * want to have self-referential structs for nested data structures to avoid a
           * circular definition problem.
           */
    
    
          function lazy(fn) {
            let struct;
            return new Struct({
              type: 'lazy',
              schema: null,
    
              *entries(value, ctx) {
                var _struct;
    
                (_struct = struct) != null ? _struct : struct = fn();
                yield* struct.entries(value, ctx);
              },
    
              validator(value, ctx) {
                var _struct2;
    
                (_struct2 = struct) != null ? _struct2 : struct = fn();
                return struct.validator(value, ctx);
              },
    
              coercer(value, ctx) {
                var _struct3;
    
                (_struct3 = struct) != null ? _struct3 : struct = fn();
                return struct.coercer(value, ctx);
              },
    
              refiner(value, ctx) {
                var _struct4;
    
                (_struct4 = struct) != null ? _struct4 : struct = fn();
                return struct.refiner(value, ctx);
              }
    
            });
          }
          /**
           * Create a new struct based on an existing object struct, but excluding
           * specific properties.
           *
           * Like TypeScript's `Omit` utility.
           */
    
    
          function omit(struct, keys) {
            const {
              schema
            } = struct;
            const subschema = { ...schema
            };
    
            for (const key of keys) {
              delete subschema[key];
            }
    
            switch (struct.type) {
              case 'type':
                return type(subschema);
    
              default:
                return object(subschema);
            }
          }
          /**
           * Create a new struct based on an existing object struct, but with all of its
           * properties allowed to be `undefined`.
           *
           * Like TypeScript's `Partial` utility.
           */
    
    
          function partial(struct) {
            const schema = struct instanceof Struct ? { ...struct.schema
            } : { ...struct
            };
    
            for (const key in schema) {
              schema[key] = optional(schema[key]);
            }
    
            return object(schema);
          }
          /**
           * Create a new struct based on an existing object struct, but only including
           * specific properties.
           *
           * Like TypeScript's `Pick` utility.
           */
    
    
          function pick(struct, keys) {
            const {
              schema
            } = struct;
            const subschema = {};
    
            for (const key of keys) {
              subschema[key] = schema[key];
            }
    
            return object(subschema);
          }
          /**
           * Define a new struct type with a custom validation function.
           *
           * @deprecated This function has been renamed to `define`.
           */
    
    
          function struct(name, validator) {
            console.warn('superstruct@0.11 - The `struct` helper has been renamed to `define`.');
            return define(name, validator);
          }
          /**
           * Ensure that any value passes validation.
           */
    
    
          function any() {
            return define('any', () => true);
          }
    
          function array(Element) {
            return new Struct({
              type: 'array',
              schema: Element,
    
              *entries(value) {
                if (Element && Array.isArray(value)) {
                  for (const [i, v] of value.entries()) {
                    yield [i, v, Element];
                  }
                }
              },
    
              coercer(value) {
                return Array.isArray(value) ? value.slice() : value;
              },
    
              validator(value) {
                return Array.isArray(value) || "Expected an array value, but received: " + print(value);
              }
    
            });
          }
          /**
           * Ensure that a value is a bigint.
           */
    
    
          function bigint() {
            return define('bigint', value => {
              return typeof value === 'bigint';
            });
          }
          /**
           * Ensure that a value is a boolean.
           */
    
    
          function boolean() {
            return define('boolean', value => {
              return typeof value === 'boolean';
            });
          }
          /**
           * Ensure that a value is a valid `Date`.
           *
           * Note: this also ensures that the value is *not* an invalid `Date` object,
           * which can occur when parsing a date fails but still returns a `Date`.
           */
    
    
          function date() {
            return define('date', value => {
              return value instanceof Date && !isNaN(value.getTime()) || "Expected a valid `Date` object, but received: " + print(value);
            });
          }
    
          function enums(values) {
            const schema = {};
            const description = values.map(v => print(v)).join();
    
            for (const key of values) {
              schema[key] = key;
            }
    
            return new Struct({
              type: 'enums',
              schema,
    
              validator(value) {
                return values.includes(value) || "Expected one of `" + description + "`, but received: " + print(value);
              }
    
            });
          }
          /**
           * Ensure that a value is a function.
           */
    
    
          function func() {
            return define('func', value => {
              return typeof value === 'function' || "Expected a function, but received: " + print(value);
            });
          }
          /**
           * Ensure that a value is an instance of a specific class.
           */
    
    
          function instance(Class) {
            return define('instance', value => {
              return value instanceof Class || "Expected a `" + Class.name + "` instance, but received: " + print(value);
            });
          }
          /**
           * Ensure that a value is an integer.
           */
    
    
          function integer() {
            return define('integer', value => {
              return typeof value === 'number' && !isNaN(value) && Number.isInteger(value) || "Expected an integer, but received: " + print(value);
            });
          }
          /**
           * Ensure that a value matches all of a set of types.
           */
    
    
          function intersection(Structs) {
            return new Struct({
              type: 'intersection',
              schema: null,
    
              *entries(value, ctx) {
                for (const S of Structs) {
                  yield* S.entries(value, ctx);
                }
              },
    
              *validator(value, ctx) {
                for (const S of Structs) {
                  yield* S.validator(value, ctx);
                }
              },
    
              *refiner(value, ctx) {
                for (const S of Structs) {
                  yield* S.refiner(value, ctx);
                }
              }
    
            });
          }
    
          function literal(constant) {
            const description = print(constant);
            const t = typeof constant;
            return new Struct({
              type: 'literal',
              schema: t === 'string' || t === 'number' || t === 'boolean' ? constant : null,
    
              validator(value) {
                return value === constant || "Expected the literal `" + description + "`, but received: " + print(value);
              }
    
            });
          }
    
          function map(Key, Value) {
            return new Struct({
              type: 'map',
              schema: null,
    
              *entries(value) {
                if (Key && Value && value instanceof Map) {
                  for (const [k, v] of value.entries()) {
                    yield [k, k, Key];
                    yield [k, v, Value];
                  }
                }
              },
    
              coercer(value) {
                return value instanceof Map ? new Map(value) : value;
              },
    
              validator(value) {
                return value instanceof Map || "Expected a `Map` object, but received: " + print(value);
              }
    
            });
          }
          /**
           * Ensure that no value ever passes validation.
           */
    
    
          function never() {
            return define('never', () => false);
          }
          /**
           * Augment an existing struct to allow `null` values.
           */
    
    
          function nullable(struct) {
            return new Struct({ ...struct,
              validator: (value, ctx) => value === null || struct.validator(value, ctx),
              refiner: (value, ctx) => value === null || struct.refiner(value, ctx)
            });
          }
          /**
           * Ensure that a value is a number.
           */
    
    
          function number() {
            return define('number', value => {
              return typeof value === 'number' && !isNaN(value) || "Expected a number, but received: " + print(value);
            });
          }
    
          function object(schema) {
            const knowns = schema ? Object.keys(schema) : [];
            const Never = never();
            return new Struct({
              type: 'object',
              schema: schema ? schema : null,
    
              *entries(value) {
                if (schema && isObject(value)) {
                  const unknowns = new Set(Object.keys(value));
    
                  for (const key of knowns) {
                    unknowns.delete(key);
                    yield [key, value[key], schema[key]];
                  }
    
                  for (const key of unknowns) {
                    yield [key, value[key], Never];
                  }
                }
              },
    
              validator(value) {
                return isObject(value) || "Expected an object, but received: " + print(value);
              },
    
              coercer(value) {
                return isObject(value) ? { ...value
                } : value;
              }
    
            });
          }
          /**
           * Augment a struct to allow `undefined` values.
           */
    
    
          function optional(struct) {
            return new Struct({ ...struct,
              validator: (value, ctx) => value === undefined || struct.validator(value, ctx),
              refiner: (value, ctx) => value === undefined || struct.refiner(value, ctx)
            });
          }
          /**
           * Ensure that a value is an object with keys and values of specific types, but
           * without ensuring any specific shape of properties.
           *
           * Like TypeScript's `Record` utility.
           */
    
    
          function record(Key, Value) {
            return new Struct({
              type: 'record',
              schema: null,
    
              *entries(value) {
                if (isObject(value)) {
                  for (const k in value) {
                    const v = value[k];
                    yield [k, k, Key];
                    yield [k, v, Value];
                  }
                }
              },
    
              validator(value) {
                return isObject(value) || "Expected an object, but received: " + print(value);
              }
    
            });
          }
          /**
           * Ensure that a value is a `RegExp`.
           *
           * Note: this does not test the value against the regular expression! For that
           * you need to use the `pattern()` refinement.
           */
    
    
          function regexp() {
            return define('regexp', value => {
              return value instanceof RegExp;
            });
          }
    
          function set(Element) {
            return new Struct({
              type: 'set',
              schema: null,
    
              *entries(value) {
                if (Element && value instanceof Set) {
                  for (const v of value) {
                    yield [v, v, Element];
                  }
                }
              },
    
              coercer(value) {
                return value instanceof Set ? new Set(value) : value;
              },
    
              validator(value) {
                return value instanceof Set || "Expected a `Set` object, but received: " + print(value);
              }
    
            });
          }
          /**
           * Ensure that a value is a string.
           */
    
    
          function string() {
            return define('string', value => {
              return typeof value === 'string' || "Expected a string, but received: " + print(value);
            });
          }
          /**
           * Ensure that a value is a tuple of a specific length, and that each of its
           * elements is of a specific type.
           */
    
    
          function tuple(Structs) {
            const Never = never();
            return new Struct({
              type: 'tuple',
              schema: null,
    
              *entries(value) {
                if (Array.isArray(value)) {
                  const length = Math.max(Structs.length, value.length);
    
                  for (let i = 0; i < length; i++) {
                    yield [i, value[i], Structs[i] || Never];
                  }
                }
              },
    
              validator(value) {
                return Array.isArray(value) || "Expected an array, but received: " + print(value);
              }
    
            });
          }
          /**
           * Ensure that a value has a set of known properties of specific types.
           *
           * Note: Unrecognized properties are allowed and untouched. This is similar to
           * how TypeScript's structural typing works.
           */
    
    
          function type(schema) {
            const keys = Object.keys(schema);
            return new Struct({
              type: 'type',
              schema,
    
              *entries(value) {
                if (isObject(value)) {
                  for (const k of keys) {
                    yield [k, value[k], schema[k]];
                  }
                }
              },
    
              validator(value) {
                return isObject(value) || "Expected an object, but received: " + print(value);
              }
    
            });
          }
          /**
           * Ensure that a value matches one of a set of types.
           */
    
    
          function union(Structs) {
            const description = Structs.map(s => s.type).join(' | ');
            return new Struct({
              type: 'union',
              schema: null,
    
              coercer(value, ctx) {
                const firstMatch = Structs.find(s => {
                  const [e] = s.validate(value, {
                    coerce: true
                  });
                  return !e;
                }) || unknown();
                return firstMatch.coercer(value, ctx);
              },
    
              validator(value, ctx) {
                const failures = [];
    
                for (const S of Structs) {
                  const [...tuples] = run(value, S, ctx);
                  const [first] = tuples;
    
                  if (!first[0]) {
                    return [];
                  } else {
                    for (const [failure] of tuples) {
                      if (failure) {
                        failures.push(failure);
                      }
                    }
                  }
                }
    
                return ["Expected the value to satisfy a union of `" + description + "`, but received: " + print(value), ...failures];
              }
    
            });
          }
          /**
           * Ensure that any value passes validation, without widening its type to `any`.
           */
    
    
          function unknown() {
            return define('unknown', () => true);
          }
          /**
           * Augment a `Struct` to add an additional coercion step to its input.
           *
           * This allows you to transform input data before validating it, to increase the
           * likelihood that it passes validation—for example for default values, parsing
           * different formats, etc.
           *
           * Note: You must use `create(value, Struct)` on the value to have the coercion
           * take effect! Using simply `assert()` or `is()` will not use coercion.
           */
    
    
          function coerce(struct, condition, coercer) {
            return new Struct({ ...struct,
              coercer: (value, ctx) => {
                return is(value, condition) ? struct.coercer(coercer(value, ctx), ctx) : struct.coercer(value, ctx);
              }
            });
          }
          /**
           * Augment a struct to replace `undefined` values with a default.
           *
           * Note: You must use `create(value, Struct)` on the value to have the coercion
           * take effect! Using simply `assert()` or `is()` will not use coercion.
           */
    
    
          function defaulted(struct, fallback, options) {
            if (options === void 0) {
              options = {};
            }
    
            return coerce(struct, unknown(), x => {
              const f = typeof fallback === 'function' ? fallback() : fallback;
    
              if (x === undefined) {
                return f;
              }
    
              if (!options.strict && isPlainObject(x) && isPlainObject(f)) {
                const ret = { ...x
                };
                let changed = false;
    
                for (const key in f) {
                  if (ret[key] === undefined) {
                    ret[key] = f[key];
                    changed = true;
                  }
                }
    
                if (changed) {
                  return ret;
                }
              }
    
              return x;
            });
          }
          /**
           * Augment a struct to trim string inputs.
           *
           * Note: You must use `create(value, Struct)` on the value to have the coercion
           * take effect! Using simply `assert()` or `is()` will not use coercion.
           */
    
    
          function trimmed(struct) {
            return coerce(struct, string(), x => x.trim());
          }
          /**
           * Ensure that a string, array, map, or set is empty.
           */
    
    
          function empty(struct) {
            return refine(struct, 'empty', value => {
              const size = getSize(value);
              return size === 0 || "Expected an empty " + struct.type + " but received one with a size of `" + size + "`";
            });
          }
    
          function getSize(value) {
            if (value instanceof Map || value instanceof Set) {
              return value.size;
            } else {
              return value.length;
            }
          }
          /**
           * Ensure that a number or date is below a threshold.
           */
    
    
          function max(struct, threshold, options) {
            if (options === void 0) {
              options = {};
            }
    
            const {
              exclusive
            } = options;
            return refine(struct, 'max', value => {
              return exclusive ? value < threshold : value <= threshold || "Expected a " + struct.type + " less than " + (exclusive ? '' : 'or equal to ') + threshold + " but received `" + value + "`";
            });
          }
          /**
           * Ensure that a number or date is above a threshold.
           */
    
    
          function min(struct, threshold, options) {
            if (options === void 0) {
              options = {};
            }
    
            const {
              exclusive
            } = options;
            return refine(struct, 'min', value => {
              return exclusive ? value > threshold : value >= threshold || "Expected a " + struct.type + " greater than " + (exclusive ? '' : 'or equal to ') + threshold + " but received `" + value + "`";
            });
          }
          /**
           * Ensure that a string, array, map or set is not empty.
           */
    
    
          function nonempty(struct) {
            return refine(struct, 'nonempty', value => {
              const size = getSize(value);
              return size > 0 || "Expected a nonempty " + struct.type + " but received an empty one";
            });
          }
          /**
           * Ensure that a string matches a regular expression.
           */
    
    
          function pattern(struct, regexp) {
            return refine(struct, 'pattern', value => {
              return regexp.test(value) || "Expected a " + struct.type + " matching `/" + regexp.source + "/` but received \"" + value + "\"";
            });
          }
          /**
           * Ensure that a string, array, number, date, map, or set has a size (or length, or time) between `min` and `max`.
           */
    
    
          function size(struct, min, max) {
            if (max === void 0) {
              max = min;
            }
    
            const expected = "Expected a " + struct.type;
            const of = min === max ? "of `" + min + "`" : "between `" + min + "` and `" + max + "`";
            return refine(struct, 'size', value => {
              if (typeof value === 'number' || value instanceof Date) {
                return min <= value && value <= max || expected + " " + of + " but received `" + value + "`";
              } else if (value instanceof Map || value instanceof Set) {
                const {
                  size
                } = value;
                return min <= size && size <= max || expected + " with a size " + of + " but received one with a size of `" + size + "`";
              } else {
                const {
                  length
                } = value;
                return min <= length && length <= max || expected + " with a length " + of + " but received one with a length of `" + length + "`";
              }
            });
          }
          /**
           * Augment a `Struct` to add an additional refinement to the validation.
           *
           * The refiner function is guaranteed to receive a value of the struct's type,
           * because the struct's existing validation will already have passed. This
           * allows you to layer additional validation on top of existing structs.
           */
    
    
          function refine(struct, name, refiner) {
            return new Struct({ ...struct,
    
              *refiner(value, ctx) {
                yield* struct.refiner(value, ctx);
                const result = refiner(value, ctx);
                const failures = toFailures(result, ctx, struct, value);
    
                for (const failure of failures) {
                  yield { ...failure,
                    refinement: name
                  };
                }
              }
    
            });
          }
    
          exports.Struct = Struct;
          exports.StructError = StructError;
          exports.any = any;
          exports.array = array;
          exports.assert = assert;
          exports.assign = assign;
          exports.bigint = bigint;
          exports.boolean = boolean;
          exports.coerce = coerce;
          exports.create = create;
          exports.date = date;
          exports.defaulted = defaulted;
          exports.define = define;
          exports.deprecated = deprecated;
          exports.dynamic = dynamic;
          exports.empty = empty;
          exports.enums = enums;
          exports.func = func;
          exports.instance = instance;
          exports.integer = integer;
          exports.intersection = intersection;
          exports.is = is;
          exports.lazy = lazy;
          exports.literal = literal;
          exports.map = map;
          exports.mask = mask;
          exports.max = max;
          exports.min = min;
          exports.never = never;
          exports.nonempty = nonempty;
          exports.nullable = nullable;
          exports.number = number;
          exports.object = object;
          exports.omit = omit;
          exports.optional = optional;
          exports.partial = partial;
          exports.pattern = pattern;
          exports.pick = pick;
          exports.record = record;
          exports.refine = refine;
          exports.regexp = regexp;
          exports.set = set;
          exports.size = size;
          exports.string = string;
          exports.struct = struct;
          exports.trimmed = trimmed;
          exports.tuple = tuple;
          exports.type = type;
          exports.union = union;
          exports.unknown = unknown;
          exports.validate = validate;
        }, {}],
        37: [function (require, module, exports) {
          (function (setImmediate, clearImmediate) {
            (function () {
              var nextTick = require('process/browser.js').nextTick;
    
              var apply = Function.prototype.apply;
              var slice = Array.prototype.slice;
              var immediateIds = {};
              var nextImmediateId = 0; // DOM APIs, for completeness
    
              exports.setTimeout = function () {
                return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
              };
    
              exports.setInterval = function () {
                return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
              };
    
              exports.clearTimeout = exports.clearInterval = function (timeout) {
                timeout.close();
              };
    
              function Timeout(id, clearFn) {
                this._id = id;
                this._clearFn = clearFn;
              }
    
              Timeout.prototype.unref = Timeout.prototype.ref = function () {};
    
              Timeout.prototype.close = function () {
                this._clearFn.call(window, this._id);
              }; // Does not start the time, just sets up the members needed.
    
    
              exports.enroll = function (item, msecs) {
                clearTimeout(item._idleTimeoutId);
                item._idleTimeout = msecs;
              };
    
              exports.unenroll = function (item) {
                clearTimeout(item._idleTimeoutId);
                item._idleTimeout = -1;
              };
    
              exports._unrefActive = exports.active = function (item) {
                clearTimeout(item._idleTimeoutId);
                var msecs = item._idleTimeout;
    
                if (msecs >= 0) {
                  item._idleTimeoutId = setTimeout(function onTimeout() {
                    if (item._onTimeout) item._onTimeout();
                  }, msecs);
                }
              }; // That's not how node.js implements it but the exposed api is the same.
    
    
              exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function (fn) {
                var id = nextImmediateId++;
                var args = arguments.length < 2 ? false : slice.call(arguments, 1);
                immediateIds[id] = true;
                nextTick(function onNextTick() {
                  if (immediateIds[id]) {
                    // fn.call() is faster so we optimize for the common use-case
                    // @see http://jsperf.com/call-apply-segu
                    if (args) {
                      fn.apply(null, args);
                    } else {
                      fn.call(null);
                    } // Prevent ids from leaking
    
    
                    exports.clearImmediate(id);
                  }
                });
                return id;
              };
              exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function (id) {
                delete immediateIds[id];
              };
            }).call(this);
          }).call(this, require("timers").setImmediate, require("timers").clearImmediate);
        }, {
          "process/browser.js": 24,
          "timers": 37
        }],
        38: [function (require, module, exports) {
          (function (global) {
            (function () {
              /**
               * Module exports.
               */
              module.exports = deprecate;
              /**
               * Mark that a method should not be used.
               * Returns a modified function which warns once by default.
               *
               * If `localStorage.noDeprecation = true` is set, then it is a no-op.
               *
               * If `localStorage.throwDeprecation = true` is set, then deprecated functions
               * will throw an Error when invoked.
               *
               * If `localStorage.traceDeprecation = true` is set, then deprecated functions
               * will invoke `console.trace()` instead of `console.error()`.
               *
               * @param {Function} fn - the function to deprecate
               * @param {String} msg - the string to print to the console when `fn` is invoked
               * @returns {Function} a new "deprecated" version of `fn`
               * @api public
               */
    
              function deprecate(fn, msg) {
                if (config('noDeprecation')) {
                  return fn;
                }
    
                var warned = false;
    
                function deprecated() {
                  if (!warned) {
                    if (config('throwDeprecation')) {
                      throw new Error(msg);
                    } else if (config('traceDeprecation')) {
                      console.trace(msg);
                    } else {
                      console.warn(msg);
                    }
    
                    warned = true;
                  }
    
                  return fn.apply(this, arguments);
                }
    
                return deprecated;
              }
              /**
               * Checks `localStorage` for boolean values for the given `name`.
               *
               * @param {String} name
               * @returns {Boolean}
               * @api private
               */
    
    
              function config(name) {
                // accessing global.localStorage can trigger a DOMException in sandboxed iframes
                try {
                  if (!global.localStorage) return false;
                } catch (_) {
                  return false;
                }
    
                var val = global.localStorage[name];
                if (null == val) return false;
                return String(val).toLowerCase() === 'true';
              }
            }).call(this);
          }).call(this, typeof __webpack_require__.g !== "undefined" ? __webpack_require__.g : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
        }, {}]
      }, {}, [3])(3);
    });
    
    /***/ }),
    
    /***/ "./src/inpage.js":
    /*!***********************!*\
      !*** ./src/inpage.js ***!
      \***********************/
    /***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    
    "use strict";
    __webpack_require__.r(__webpack_exports__);
    /* harmony import */ var _WindowPostMessageStream__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./WindowPostMessageStream */ "./src/WindowPostMessageStream.js");
    /* harmony import */ var _WindowPostMessageStream__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_WindowPostMessageStream__WEBPACK_IMPORTED_MODULE_0__);
    /* harmony import */ var _prajjawal_qrl_providers_dist_initializeInpageProvider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @prajjawal/qrl_providers/dist/initializeInpageProvider */ "./node_modules/@prajjawal/qrl_providers/dist/initializeInpageProvider.js");
    
    
    const metamaskStream = new _WindowPostMessageStream__WEBPACK_IMPORTED_MODULE_0__.WindowPostMessageStream({
      name: 'metamask-inpage',
      target: 'metamask-contentscript'
    });
    (0,_prajjawal_qrl_providers_dist_initializeInpageProvider__WEBPACK_IMPORTED_MODULE_1__.initializeProvider)({
      connectionStream: metamaskStream,
      logger: console,
      shouldShimWeb3: true
    });
    
    /***/ }),
    
    /***/ "?b950":
    /*!**********************!*\
      !*** util (ignored) ***!
      \**********************/
    /***/ (function() {
    
    /* (ignored) */
    
    /***/ }),
    
    /***/ "?0ae1":
    /*!**********************!*\
      !*** util (ignored) ***!
      \**********************/
    /***/ (function() {
    
    /* (ignored) */
    
    /***/ }),
    
    /***/ "?32fb":
    /*!**********************!*\
      !*** util (ignored) ***!
      \**********************/
    /***/ (function() {
    
    /* (ignored) */
    
    /***/ }),
    
    /***/ "?877f":
    /*!**********************!*\
      !*** util (ignored) ***!
      \**********************/
    /***/ (function() {
    
    /* (ignored) */
    
    /***/ }),
    
    /***/ "?7a07":
    /*!********************!*\
      !*** fs (ignored) ***!
      \********************/
    /***/ (function() {
    
    /* (ignored) */
    
    /***/ })
    
    /******/ 	});
    /************************************************************************/
    /******/ 	// The module cache
    /******/ 	var __webpack_module_cache__ = {};
    /******/ 	
    /******/ 	// The require function
    /******/ 	function __webpack_require__(moduleId) {
    /******/ 		// Check if module is in cache
    /******/ 		var cachedModule = __webpack_module_cache__[moduleId];
    /******/ 		if (cachedModule !== undefined) {
    /******/ 			return cachedModule.exports;
    /******/ 		}
    /******/ 		// Create a new module (and put it into the cache)
    /******/ 		var module = __webpack_module_cache__[moduleId] = {
    /******/ 			id: moduleId,
    /******/ 			// no module.loaded needed
    /******/ 			exports: {}
    /******/ 		};
    /******/ 	
    /******/ 		// Execute the module function
    /******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    /******/ 	
    /******/ 		// Return the exports of the module
    /******/ 		return module.exports;
    /******/ 	}
    /******/ 	
    /******/ 	// expose the modules object (__webpack_modules__)
    /******/ 	__webpack_require__.m = __webpack_modules__;
    /******/ 	
    /************************************************************************/
    /******/ 	/* webpack/runtime/chunk loaded */
    /******/ 	!function() {
    /******/ 		var deferred = [];
    /******/ 		__webpack_require__.O = function(result, chunkIds, fn, priority) {
    /******/ 			if(chunkIds) {
    /******/ 				priority = priority || 0;
    /******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
    /******/ 				deferred[i] = [chunkIds, fn, priority];
    /******/ 				return;
    /******/ 			}
    /******/ 			var notFulfilled = Infinity;
    /******/ 			for (var i = 0; i < deferred.length; i++) {
    /******/ 				var chunkIds = deferred[i][0];
    /******/ 				var fn = deferred[i][1];
    /******/ 				var priority = deferred[i][2];
    /******/ 				var fulfilled = true;
    /******/ 				for (var j = 0; j < chunkIds.length; j++) {
    /******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every(function(key) { return __webpack_require__.O[key](chunkIds[j]); })) {
    /******/ 						chunkIds.splice(j--, 1);
    /******/ 					} else {
    /******/ 						fulfilled = false;
    /******/ 						if(priority < notFulfilled) notFulfilled = priority;
    /******/ 					}
    /******/ 				}
    /******/ 				if(fulfilled) {
    /******/ 					deferred.splice(i--, 1)
    /******/ 					var r = fn();
    /******/ 					if (r !== undefined) result = r;
    /******/ 				}
    /******/ 			}
    /******/ 			return result;
    /******/ 		};
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/compat get default export */
    /******/ 	!function() {
    /******/ 		// getDefaultExport function for compatibility with non-harmony modules
    /******/ 		__webpack_require__.n = function(module) {
    /******/ 			var getter = module && module.__esModule ?
    /******/ 				function() { return module['default']; } :
    /******/ 				function() { return module; };
    /******/ 			__webpack_require__.d(getter, { a: getter });
    /******/ 			return getter;
    /******/ 		};
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/define property getters */
    /******/ 	!function() {
    /******/ 		// define getter functions for harmony exports
    /******/ 		__webpack_require__.d = function(exports, definition) {
    /******/ 			for(var key in definition) {
    /******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
    /******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
    /******/ 				}
    /******/ 			}
    /******/ 		};
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/ensure chunk */
    /******/ 	!function() {
    /******/ 		// The chunk loading function for additional chunks
    /******/ 		// Since all referenced chunks are already included
    /******/ 		// in this file, this function is empty here.
    /******/ 		__webpack_require__.e = function() { return Promise.resolve(); };
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/global */
    /******/ 	!function() {
    /******/ 		__webpack_require__.g = (function() {
    /******/ 			if (typeof globalThis === 'object') return globalThis;
    /******/ 			try {
    /******/ 				return this || new Function('return this')();
    /******/ 			} catch (e) {
    /******/ 				if (typeof window === 'object') return window;
    /******/ 			}
    /******/ 		})();
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/hasOwnProperty shorthand */
    /******/ 	!function() {
    /******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/make namespace object */
    /******/ 	!function() {
    /******/ 		// define __esModule on exports
    /******/ 		__webpack_require__.r = function(exports) {
    /******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    /******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    /******/ 			}
    /******/ 			Object.defineProperty(exports, '__esModule', { value: true });
    /******/ 		};
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/jsonp chunk loading */
    /******/ 	!function() {
    /******/ 		// no baseURI
    /******/ 		
    /******/ 		// object to store loaded and loading chunks
    /******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
    /******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
    /******/ 		var installedChunks = {
    /******/ 			"inpage": 0
    /******/ 		};
    /******/ 		
    /******/ 		// no chunk on demand loading
    /******/ 		
    /******/ 		// no prefetching
    /******/ 		
    /******/ 		// no preloaded
    /******/ 		
    /******/ 		// no HMR
    /******/ 		
    /******/ 		// no HMR manifest
    /******/ 		
    /******/ 		__webpack_require__.O.j = function(chunkId) { return installedChunks[chunkId] === 0; };
    /******/ 		
    /******/ 		// install a JSONP callback for chunk loading
    /******/ 		var webpackJsonpCallback = function(parentChunkLoadingFunction, data) {
    /******/ 			var chunkIds = data[0];
    /******/ 			var moreModules = data[1];
    /******/ 			var runtime = data[2];
    /******/ 			// add "moreModules" to the modules object,
    /******/ 			// then flag all "chunkIds" as loaded and fire callback
    /******/ 			var moduleId, chunkId, i = 0;
    /******/ 			if(chunkIds.some(function(id) { return installedChunks[id] !== 0; })) {
    /******/ 				for(moduleId in moreModules) {
    /******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
    /******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
    /******/ 					}
    /******/ 				}
    /******/ 				if(runtime) var result = runtime(__webpack_require__);
    /******/ 			}
    /******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
    /******/ 			for(;i < chunkIds.length; i++) {
    /******/ 				chunkId = chunkIds[i];
    /******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
    /******/ 					installedChunks[chunkId][0]();
    /******/ 				}
    /******/ 				installedChunks[chunkId] = 0;
    /******/ 			}
    /******/ 			return __webpack_require__.O(result);
    /******/ 		}
    /******/ 		
    /******/ 		var chunkLoadingGlobal = self["webpackChunkapp"] = self["webpackChunkapp"] || [];
    /******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
    /******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
    /******/ 	}();
    /******/ 	
    /************************************************************************/
    /******/ 	
    /******/ 	// startup
    /******/ 	// Load entry module and return exports
    /******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
    /******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["chunk-vendors"], function() { return __webpack_require__("./src/inpage.js"); })
    /******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
    /******/ 	
    /******/ })();}
let inpage2 = ()=>{
    //@ sourceURL = chrome-extension://plgbbiohldekakchldmmjdjaedchbnkg/js/inpage.js
    /******/ (function() { // webpackBootstrap
    /******/ 	var __webpack_modules__ = ({
    
    /***/ "./src/inpage.js":
    /*!***********************!*\
      !*** ./src/inpage.js ***!
      \***********************/
    /***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
    
    "use strict";
    __webpack_require__.r(__webpack_exports__);
    /* harmony import */ var _metamask_post_message_stream__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @metamask/post-message-stream */ "./node_modules/@metamask/post-message-stream/dist/browser.js");
    /* harmony import */ var _metamask_post_message_stream__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_metamask_post_message_stream__WEBPACK_IMPORTED_MODULE_0__);
    /* harmony import */ var _prajjawal_qrl_providers_dist_initializeInpageProvider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @prajjawal/qrl_providers/dist/initializeInpageProvider */ "./node_modules/@prajjawal/qrl_providers/dist/initializeInpageProvider.js");
    
    
    const metamaskStream = new _metamask_post_message_stream__WEBPACK_IMPORTED_MODULE_0__.WindowPostMessageStream({
      name: 'metamask-inpage',
      target: 'metamask-contentscript'
    });
    (0,_prajjawal_qrl_providers_dist_initializeInpageProvider__WEBPACK_IMPORTED_MODULE_1__.initializeProvider)({
      connectionStream: metamaskStream,
      logger: console,
      shouldShimWeb3: true
    });
    
    /***/ }),
    
    /***/ "?b950":
    /*!**********************!*\
      !*** util (ignored) ***!
      \**********************/
    /***/ (function() {
    
    /* (ignored) */
    
    /***/ }),
    
    /***/ "?0ae1":
    /*!**********************!*\
      !*** util (ignored) ***!
      \**********************/
    /***/ (function() {
    
    /* (ignored) */
    
    /***/ }),
    
    /***/ "?7459":
    /*!**********************!*\
      !*** util (ignored) ***!
      \**********************/
    /***/ (function() {
    
    /* (ignored) */
    
    /***/ }),
    
    /***/ "?32fb":
    /*!**********************!*\
      !*** util (ignored) ***!
      \**********************/
    /***/ (function() {
    
    /* (ignored) */
    
    /***/ }),
    
    /***/ "?877f":
    /*!**********************!*\
      !*** util (ignored) ***!
      \**********************/
    /***/ (function() {
    
    /* (ignored) */
    
    /***/ }),
    
    /***/ "?7a07":
    /*!********************!*\
      !*** fs (ignored) ***!
      \********************/
    /***/ (function() {
    
    /* (ignored) */
    
    /***/ })
    
    /******/ 	});
    /************************************************************************/
    /******/ 	// The module cache
    /******/ 	var __webpack_module_cache__ = {};
    /******/ 	
    /******/ 	// The require function
    /******/ 	function __webpack_require__(moduleId) {
    /******/ 		// Check if module is in cache
    /******/ 		var cachedModule = __webpack_module_cache__[moduleId];
    /******/ 		if (cachedModule !== undefined) {
    /******/ 			return cachedModule.exports;
    /******/ 		}
    /******/ 		// Create a new module (and put it into the cache)
    /******/ 		var module = __webpack_module_cache__[moduleId] = {
    /******/ 			id: moduleId,
    /******/ 			// no module.loaded needed
    /******/ 			exports: {}
    /******/ 		};
    /******/ 	
    /******/ 		// Execute the module function
    /******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    /******/ 	
    /******/ 		// Return the exports of the module
    /******/ 		return module.exports;
    /******/ 	}
    /******/ 	
    /******/ 	// expose the modules object (__webpack_modules__)
    /******/ 	__webpack_require__.m = __webpack_modules__;
    /******/ 	
    /************************************************************************/
    /******/ 	/* webpack/runtime/chunk loaded */
    /******/ 	!function() {
    /******/ 		var deferred = [];
    /******/ 		__webpack_require__.O = function(result, chunkIds, fn, priority) {
    /******/ 			if(chunkIds) {
    /******/ 				priority = priority || 0;
    /******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
    /******/ 				deferred[i] = [chunkIds, fn, priority];
    /******/ 				return;
    /******/ 			}
    /******/ 			var notFulfilled = Infinity;
    /******/ 			for (var i = 0; i < deferred.length; i++) {
    /******/ 				var chunkIds = deferred[i][0];
    /******/ 				var fn = deferred[i][1];
    /******/ 				var priority = deferred[i][2];
    /******/ 				var fulfilled = true;
    /******/ 				for (var j = 0; j < chunkIds.length; j++) {
    /******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every(function(key) { return __webpack_require__.O[key](chunkIds[j]); })) {
    /******/ 						chunkIds.splice(j--, 1);
    /******/ 					} else {
    /******/ 						fulfilled = false;
    /******/ 						if(priority < notFulfilled) notFulfilled = priority;
    /******/ 					}
    /******/ 				}
    /******/ 				if(fulfilled) {
    /******/ 					deferred.splice(i--, 1)
    /******/ 					var r = fn();
    /******/ 					if (r !== undefined) result = r;
    /******/ 				}
    /******/ 			}
    /******/ 			return result;
    /******/ 		};
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/compat get default export */
    /******/ 	!function() {
    /******/ 		// getDefaultExport function for compatibility with non-harmony modules
    /******/ 		__webpack_require__.n = function(module) {
    /******/ 			var getter = module && module.__esModule ?
    /******/ 				function() { return module['default']; } :
    /******/ 				function() { return module; };
    /******/ 			__webpack_require__.d(getter, { a: getter });
    /******/ 			return getter;
    /******/ 		};
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/define property getters */
    /******/ 	!function() {
    /******/ 		// define getter functions for harmony exports
    /******/ 		__webpack_require__.d = function(exports, definition) {
    /******/ 			for(var key in definition) {
    /******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
    /******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
    /******/ 				}
    /******/ 			}
    /******/ 		};
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/ensure chunk */
    /******/ 	!function() {
    /******/ 		// The chunk loading function for additional chunks
    /******/ 		// Since all referenced chunks are already included
    /******/ 		// in this file, this function is empty here.
    /******/ 		__webpack_require__.e = function() { return Promise.resolve(); };
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/global */
    /******/ 	!function() {
    /******/ 		__webpack_require__.g = (function() {
    /******/ 			if (typeof globalThis === 'object') return globalThis;
    /******/ 			try {
    /******/ 				return this || new Function('return this')();
    /******/ 			} catch (e) {
    /******/ 				if (typeof window === 'object') return window;
    /******/ 			}
    /******/ 		})();
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/hasOwnProperty shorthand */
    /******/ 	!function() {
    /******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/make namespace object */
    /******/ 	!function() {
    /******/ 		// define __esModule on exports
    /******/ 		__webpack_require__.r = function(exports) {
    /******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    /******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    /******/ 			}
    /******/ 			Object.defineProperty(exports, '__esModule', { value: true });
    /******/ 		};
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/jsonp chunk loading */
    /******/ 	!function() {
    /******/ 		// no baseURI
    /******/ 		
    /******/ 		// object to store loaded and loading chunks
    /******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
    /******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
    /******/ 		var installedChunks = {
    /******/ 			"inpage": 0
    /******/ 		};
    /******/ 		
    /******/ 		// no chunk on demand loading
    /******/ 		
    /******/ 		// no prefetching
    /******/ 		
    /******/ 		// no preloaded
    /******/ 		
    /******/ 		// no HMR
    /******/ 		
    /******/ 		// no HMR manifest
    /******/ 		
    /******/ 		__webpack_require__.O.j = function(chunkId) { return installedChunks[chunkId] === 0; };
    /******/ 		
    /******/ 		// install a JSONP callback for chunk loading
    /******/ 		var webpackJsonpCallback = function(parentChunkLoadingFunction, data) {
    /******/ 			var chunkIds = data[0];
    /******/ 			var moreModules = data[1];
    /******/ 			var runtime = data[2];
    /******/ 			// add "moreModules" to the modules object,
    /******/ 			// then flag all "chunkIds" as loaded and fire callback
    /******/ 			var moduleId, chunkId, i = 0;
    /******/ 			if(chunkIds.some(function(id) { return installedChunks[id] !== 0; })) {
    /******/ 				for(moduleId in moreModules) {
    /******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
    /******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
    /******/ 					}
    /******/ 				}
    /******/ 				if(runtime) var result = runtime(__webpack_require__);
    /******/ 			}
    /******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
    /******/ 			for(;i < chunkIds.length; i++) {
    /******/ 				chunkId = chunkIds[i];
    /******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
    /******/ 					installedChunks[chunkId][0]();
    /******/ 				}
    /******/ 				installedChunks[chunkId] = 0;
    /******/ 			}
    /******/ 			return __webpack_require__.O(result);
    /******/ 		}
    /******/ 		
    /******/ 		var chunkLoadingGlobal = self["webpackChunkapp"] = self["webpackChunkapp"] || [];
    /******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
    /******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
    /******/ 	}();
    /******/ 	
    /************************************************************************/
    /******/ 	
    /******/ 	// startup
    /******/ 	// Load entry module and return exports
    /******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
    /******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["chunk-vendors"], function() { return __webpack_require__("./src/inpage.js"); })
    /******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
    /******/ 	
    /******/ })();
    }

    // console.log(inpage.toString().slice(10,-2))

injectScript()
setupStreams()