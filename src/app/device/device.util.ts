function convolve(input: number[], kernel: number[], mode: string) {
  const inputLength = input.length;
  const kernelLength = kernel.length;
  const outputLength = inputLength + kernelLength - 1;
  const output = new Array<number>(outputLength).fill(0);

  for (let i = 0; i < inputLength; i++) {
    for (let j = 0; j < kernelLength; j++) {
      output[i + j] += input[i] * kernel[j];
    }
  }

  if (mode === 'valid') {
    const startIndex = Math.floor(kernelLength / 2);
    const endIndex = outputLength - Math.ceil(kernelLength / 2);
    return output.slice(startIndex, endIndex);
  }

  return output;
}

function smooth(y: number[], windowSize: number) {
  const ones = new Array(windowSize).fill(1);
  const kernel = ones.map((value) => value / windowSize);
  const ySmooth = convolve(y, kernel, 'valid');
  return ySmooth;
}

export { convolve, smooth };
