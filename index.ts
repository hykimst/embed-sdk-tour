// IMPORT NPM @ matterport/sdk
import { setupSdk } from '@matterport/sdk';

// Connect MPSDK to your app div
const app = document.querySelector('#app');
const div = document.getElementById('button-container');
const naviBtn = document.querySelector('#navi-btn');

let mpSdk = null;
let sweepCollection = null;
let roomCollection = null;
let collection;

const tourTheRoom = async function (roomSweeps) {
  const transition = mpSdk.Sweep.Transition.INSTANT;
  const transitionTime = 1000; // in milliseconds
  console.log('[tourTheRoom]', roomSweeps);

  roomSweeps.sweeps.forEach((eachSweep) => {
    mpSdk.Sweep.moveTo(eachSweep.sid, {
      rotation: eachSweep.rotation,
      transition: transition,
      transitionTime: transitionTime,
    }).then(function (sweepId) {
      // Move successful.
      console.log('[Sweep] Arrived at sweep ', roomSweeps.label, sweepId);
      const back = mpSdk.Camera.Direction.BACK;
      mpSdk.Camera.moveInDirection(back).then((e) => {
        console.log('[Camera] rotate');
        mpSdk.Camera.rotate(-10, -0, {
          speed: 5,
        });
      });
    });
  });
};

const collectSweeps = function (roomboundary) {
  let sweep = null;
  // Find all the sweeps that fall between the room boundary min & max
  for (const [key, value] of sweepCollection) {
    let sweepPosition = value.position;

    // Check X-axis: Min <= Px <= Max
    const isXInBounds =
      sweepPosition.x >= roomboundary.min.x &&
      sweepPosition.x <= roomboundary.max.x; // Check Y-axis: Min <= Py <= Max
    const isYInBounds =
      sweepPosition.y >= roomboundary.min.y &&
      sweepPosition.y <= roomboundary.max.y; // Check Z-axis: Min <= Pz <= Max
    const isZInBounds =
      sweepPosition.z >= roomboundary.min.z &&
      sweepPosition.z <= roomboundary.max.z; // The point is within the boundary if it is in bounds on ALL three axes.
    if (isXInBounds && isYInBounds && isZInBounds) {
      if (sweep == null) {
        sweep = value;
      }
    }
  }
  return sweep;
};
const findRoomSweeps = function () {
  // Go through each room
  for (const [key, value] of roomCollection) {
    const roomId = key;
    const roomLabel = value.label || '';
    const roomboundary = value.bounds || {
      min: { x: 0, y: 0 },
      max: { x: 0, y: 0 },
    };
    const sweep = collectSweeps(roomboundary);
    console.log('--- roomId', roomId);
    if (collection[roomId] == null) {
      collection[roomId] = {
        sweeps: [],
        label: roomLabel,
      };
    }
    collection[roomId].sweeps.push(sweep);
    console.log(
      '[Collection]',
      '\nsweep:',
      sweep,
      '\nroomId:',
      roomId,
      '\nroomLabel:',
      roomLabel,
      '\nroomCollection:',
      collection[roomId]
    );
  }
};

const clicklistener = function () {
  const roomId = this.id;
  const currentRoom = roomCollection[roomId] || {};
  const roomSweeps = collection[roomId] || null;
  console.log('[Click]', roomId, currentRoom, collection, roomSweeps);
  if (roomSweeps != null) {
    tourTheRoom(roomSweeps);
  }
};

/**
 * Create button from room collection label the label are from RoomClassification
 */
const createRoomButton = function () {
  for (const [key, value] of roomCollection) {
    // console.log('[createRoomButton] ', key, value);
    var button = document.createElement('button');
    button.id = key;
    button.innerHTML = value.label;
    button.addEventListener('click', clicklistener);
    div.appendChild(button);
  }
};

const getRoomData = async function () {
  if (collection == null) {
    collection = {};
  }
  const roomSubscription = await mpSdk.Room.data.waitUntil((collection) => {
    roomCollection = collection;
    console.log('[Room Data] onCollectionUpdated', roomCollection);
    return collection != null;
  });
  const sweepSubscription = await mpSdk.Sweep.data.waitUntil((collection) => {
    sweepCollection = collection;
    console.log('[Sweep] onCollectionUpdated', sweepCollection);
    return collection != null;
  });
  if (!!roomSubscription && !!sweepSubscription) {
    findRoomSweeps();
    createRoomButton();
  }
};
/*============================================
  SETUP SDK
  https://www.npmjs.com/package/@matterport/sdk
==============================================*/
const options = {
  /**
   * Array of options to pass on SDK connection.
   * Anything from sdk.connect will work here.
   */
  connectOptions: [],

  /**
   * The element or selector that will attach the created iframe.
   * Defaults to document.body if not specified.
   * Ignored if the `iframe` option is provided.
   */
  container: app,

  /**
   * The domain to connect to. Defaults to `my.matterport.com`.
   */
  domain: 'my.matterport.com',

  /**
   * The element or selector to use as the iframe for space display.
   * Creates a new iframe if falsy. Default `undefined`.
   */
  iframe: undefined,

  /**
   * The options to pass to the iframe, as an object of
   * attribute keys and values.
   *
   * { width: '500px', height: '500px' }
   * creates: <iframe width="500px" height="500px">
   * ```
   */
  iframeAttributes: {
    width: '800px',
    height: '500px',
  },

  /**
   * The query params to include in the iframe's `src` URL. See
   * https://support.matterport.com/s/article/URL-Parameters
   * for a full list.
   *
   * Do not specify the `m` param in these params -
   * use the `space` option instead.
   *
   * ```
   * { qs: 1 }
   * creates: <iframe src="...&qs=1">
   * ```
   */
  iframeQueryParams: {
    play: 1,
    qs: 1,
  },

  /**
   * Space ID. Defaults to an example if not specified.
   */
  space: '76VYD7xqkCb',
};
// Initialize SDK
const main = async () => {
  const sdk = await setupSdk('yxszifc05b1bidcsqfr60806d', options);
  mpSdk = sdk;
  console.log('[MPSDK]', mpSdk);
  getRoomData();
};
main().catch((err) => console.error('MAIN ERROR', err));
