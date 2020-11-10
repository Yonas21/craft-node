/**
 * Get the car data reduced to just the variables we are interested
 * and cleaned of missing data.
 */

async function getData() {
  const carsDataResponse = await fetch(
    'https://storage.googleapis.com/tfjs-tutorials/carsData.json'
  );

  const carsData = await carsDataResponse.json();
  const cleanedData = carsData
    .map((car) => ({
      mpg: car.Miles_per_Gallon,
      horsepower: car.Horsepower,
    }))
    .filter((car) => car.mpg != null && car.horsepower != null);

  return cleanedData;
}

// create model to give input and produce output from the given data
function createModel() {
  // create sequential model
  const model = tf.sequential();

  //   add single input layer
  model.add(tf.layers.dense({ inputShape: [1], units: 1, useBias: true }));

  //   add output layer
  model.add(tf.layers.dense({ units: 1, useBias: true }));

  // add another model
  // model.add(tf.layers.dense({ units: 50, activation: 'sigmoid' }));

  return model;
}

/**
 * Convert the input data to tensors that we can use for machine
 * learning. We will also do the important best practices of _shuffling_
 * the data and _normalizing_ the data
 * MPG on the y-axis.
 */

function convertToTensor(data) {
  // Wrapping these calculations in a tidy will dispose any
  // intermediate tensors.
  return tf.tidy(() => {
    //    step 1. shuffle the data
    tf.util.shuffle(data);

    // step 2: convert data to tensor
    const inputs = data.map((d) => d.horsepower);
    const labels = data.map((d) => d.mpg);

    const inputTensor = tf.tensor2d(inputs, [inputs.length, 1]);
    const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

    // step 3: normalize the data between 0 and 1
    const inputMax = inputTensor.max();
    const inputMin = inputTensor.min();
    const labelMax = labelTensor.max();
    const labelMin = labelTensor.min();

    const normalizedInputs = inputTensor
      .sub(inputMin)
      .div(inputMax.sub(inputMin));

    const normalizedLabels = labelTensor
      .sub(labelMin)
      .div(labelMax.sub(labelMin));

    return {
      inputs: normalizedInputs,
      labels: normalizedLabels,
      inputMax,
      inputMin,
      labelMax,
      labelMin,
    };
  });
}

async function trainModel(model, inputs, labels) {
  // prepare the model training
  model.compile({
    optimizer: tf.train.adam(),
    loss: tf.losses.meanSquaredError,
    metrics: ['mse'],
  });

  const batchSize = 32;
  const epochs = 50;

  return await model.fit(inputs, labels, {
    batchSize,
    epochs,
    shuffle: true,
    callbacks: tfvis.show.fitCallbacks(
      {
        name: 'Training Performance',
      },
      ['loss', 'mse'],
      {
        height: 250,
        callbacks: ['onEpochEnd'],
      }
    ),
  });
}

function testModel(model, inputData, normalizationData) {
  const { inputMin, inputMax, labelMin, labelMax } = normalizationData;

  // Generate predictions for a uniform range of numbers between 0 and 1;
  // We un-normalize the data by doing the inverse of the min-max scaling
  // that we did earlier.
  const [xs, preds] = tf.tidy(() => {
    const xs = tf.linspace(0, 1, 100);
    const preds = model.predict(xs.reshape([100, 1]));

    const unNormXs = xs.mul(inputMax.sub(inputMin)).add(inputMin);

    const unNormPreds = preds.mul(labelMax.sub(labelMin)).add(labelMin);

    // un-normalize the data
    return [unNormXs.dataSync(), unNormPreds.dataSync()];
  });

  const predictedPoints = Array.from(xs).map((val, i) => {
    return { x: val, y: preds[i] };
  });

  const originalPoints = inputData.map((d) => ({
    x: d.horsepower,
    y: d.mpg,
  }));

  tfvis.render.scatterplot(
    {
      name: 'Model Predictions Vs Original Predictions',
    },
    {
      values: [originalPoints, predictedPoints],
      series: ['Original', 'Predicted'],
    },
    { xLabel: 'HorsePower', yLabel: 'MilePerGallon', height: 300 }
  );
}

async function run() {
  // get cleaned data and assign to two dimensional axis
  const data = await getData();
  const values = data.map((d) => ({
    x: d.horsepower,
    y: d.mpg,
  }));
  /*

  //   plot the assigned data
  tfvis.render.scatterplot(
    {
      name: 'HorsePower Vs Miles Per Gallon',
    },
    { values },
    { xLabel: 'HorsePower' },
    { yLabel: 'MilePerGallon' },
    { height: 300 }
  );

  */
  //   create model
  const model = createModel();
  tfvis.show.modelSummary({ name: 'Model Summary' }, model);

  // Convert the data to a form we can use for training.
  const tensorData = convertToTensor(data);
  const { inputs, labels } = tensorData;

  //train Model
  // await trainModel(model, inputs, labels);

  // Make some predictions using the model and compare them to the
  // original data
  testModel(model, data, tensorData);
  console.log('Done Training');
}

document.addEventListener('DOMContentLoaded', run, { passive: true });
