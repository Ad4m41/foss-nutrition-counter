import React, { useEffect, useState } from 'react';
import {
  Fit,
  RiveView,
  useRiveFile,
  useViewModelInstance,
  useRiveNumber,
} from '@rive-app/react-native';
import { OtterFallback, type OtterProps } from './OtterFallback';
export function OtterRive({ bodyScale, hydration }: OtterProps) {
  const { riveFile, error } = useRiveFile(
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro registers the bundled Rive asset
    require('../../assets/otter/otter.riv'),
  );
  const { instance, error: bindingError } = useViewModelInstance(riveFile, {
    async: true,
  });
  const { setValue: setBody } = useRiveNumber('bodyScale', instance);
  const { setValue: setWater } = useRiveNumber('hydration', instance);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (instance) {
      setBody(bodyScale);
      setWater(hydration);
    }
  }, [instance, bodyScale, hydration, setBody, setWater]);
  if (error || bindingError || failed || !riveFile || !instance)
    return <OtterFallback />;
  return (
    <RiveView
      file={riveFile}
      dataBind={instance}
      artboardName="Otter"
      stateMachineName="Otter"
      fit={Fit.Contain}
      autoPlay
      frameRate={30}
      style={{ width: 100, height: 106 }}
      onError={() => setFailed(true)}
    />
  );
}
