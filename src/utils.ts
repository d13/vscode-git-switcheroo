// yes, this is a simple debounce function, but this is all I need for now
export function debounce(fn: (...args: any[]) => any, wait: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return function (this: any, ...args: Parameters<typeof fn>) {
    if (timer !== undefined) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = undefined;
    }, wait);
  };
}
