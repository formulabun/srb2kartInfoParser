import Canvas from 'canvas';
const {createCanvas} = Canvas;

const defaultPalette = [
  176, 176, 160, 177, 160, 162, 185, 186, 186, 187, 168, 169, 170, 189,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
]
// algorithm from the doomwiki
function convertGraphic(bytes) {
  const width = bytes.readUInt16LE(0);
  const height = bytes.readUInt16LE(2);
  const leftoffset = bytes.readUInt16LE(4);
  const rightoffset = bytes.readUInt16LE(6);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(width, height);

  ctx.beginPath();
  ctx.lineTo(10,10);
  ctx.stroke();

  const column_array = new Array(width);

  for(var i = 0; i < width ; i++) {
    column_array[i] = bytes.readUInt32LE(8 + i * 4);
  }

  for(var i = 0; i < width ; i++) {
    const col = column_array[i];
    let rowoffset = 0;
    let rowstart = 0;
    while(rowstart !== 255) {
      rowstart = bytes.readUInt8(col+(rowoffset++));
      if (rowstart === 255) break;
      const pixel_count = bytes.readUInt8(col+(rowoffset++));
      let dummy_val = bytes.readUInt8(col+(rowoffset++));
      
      for(var j = 0 ; j < pixel_count ; j++) {
        const pixel = bytes.readUInt8(col+(rowoffset++));
        image.data[width*4*(j+rowstart) + i*4] = pixel;
        image.data[width*4*(j+rowstart) + i*4 + 1] = pixel;
        image.data[width*4*(j+rowstart) + i*4 + 2] = pixel;
        image.data[width*4*(j+rowstart) + i*4 + 3] = 255;
      }
      dummy_val = bytes.readUInt8(col+(rowoffset++));

    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.createPNGStream();
}

export default convertGraphic;
