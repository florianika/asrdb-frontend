/// <reference lib="webworker" />

let interval: any;
addEventListener('message', ({ data }) => {
  if (data === 'stopInterval') {
    clearInterval(interval);
    interval = null;
  } else if (!interval) {
    interval = setInterval(() => {
      postMessage('NOW RELOAD');
    }, 3000);
  }
});
