import { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';

export default function ParticlesBackground({ id, variant = 'default' } = {}) {
    const particlesInit = useCallback(async (engine) => {
        await loadSlim(engine);
    }, []);

    const particlesLoaded = useCallback(async () => {}, []);

    const commonOptions = {
        fullScreen: {
            enable: false,
        },
        background: {
            color: {
                value: 'transparent',
            },
        },
        fpsLimit: 120,
        interactivity: {
            events: {
                onClick: {
                    enable: false,
                },
                onHover: {
                    enable: false,
                },
                resize: true,
            },
        },
        detectRetina: true,
    };

    const options =
        variant === 'pulse'
            ? {
                  ...commonOptions,
                  particles: {
                      color: { value: '#00acb1' },
                      links: {
                          color: '#005963',
                          distance: 160,
                          enable: true,
                          opacity: 0.18,
                          width: 1,
                      },
                      move: {
                          direction: 'right',
                          enable: true,
                          outModes: { default: 'out' },
                          random: false,
                          speed: 1.2,
                          straight: false,
                      },
                      number: {
                          density: { enable: true, area: 900 },
                          value: 45,
                      },
                      opacity: {
                          value: { min: 0.15, max: 0.45 },
                          animation: {
                              enable: true,
                              speed: 0.8,
                              minimumValue: 0.12,
                              sync: false,
                          },
                      },
                      shape: { type: 'circle' },
                      size: { value: { min: 1, max: 3 } },
                  },
              }
            : {
                  ...commonOptions,
                  particles: {
                      color: {
                          value: '#ffffff',
                      },
                      links: {
                          color: '#005963',
                          distance: 150,
                          enable: true,
                          opacity: 0.3,
                          width: 1,
                      },
                      move: {
                          direction: 'none',
                          enable: true,
                          outModes: {
                              default: 'bounce',
                          },
                          random: false,
                          speed: 2,
                          straight: false,
                      },
                      number: {
                          density: {
                              enable: true,
                              area: 800,
                          },
                          value: 60,
                      },
                      opacity: {
                          value: 0.5,
                      },
                      shape: {
                          type: 'circle',
                      },
                      size: {
                          value: { min: 1, max: 3 },
                      },
                  },
              };

    return (
        <Particles
            id={id}
            init={particlesInit}
            loaded={particlesLoaded}
            options={options}
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                pointerEvents: 'none',
            }}
        />
    );
}
