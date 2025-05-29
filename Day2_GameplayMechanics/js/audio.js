/**
 * Audio system for the game
 * Handles procedural sound generation and playback
 */
class AudioManager {
	constructor() {
		this.audioContext = null;
		this.masterGain = null;
		this.initialized = false;
		this.muted = false;

		this.sounds = {};
	}

	// must be called after user interaction
	init() {
		if (this.initialized) {
			return;
		}

		try {
			this.audioContext = new (
				window.AudioContext || window.webkitAudioContext
			)();
			this.masterGain = this.audioContext.createGain();
			this.masterGain.connect(this.audioContext.destination);
			this.initialized = true;

			this.createSoundBank();
		} catch (e) {
			console.error("Failed to initialize audio context:", e);
		}
	}

	createSoundBank() {
		this.createJumpSound();
		this.createCollectSound();
		this.createHitSound();
		this.createCompleteLevelSound();
		this.createGameOverSound();
	}

	playTone(frequency, duration, volume = 0.5, type = "sine") {
		if (!this.initialized || this.muted) {
			return;
		}

		const oscillator = this.audioContext.createOscillator();
		const gainNode = this.audioContext.createGain();

		oscillator.type = type;
		oscillator.frequency.value = frequency;
		gainNode.gain.value = volume;

		oscillator.connect(gainNode);
		gainNode.connect(this.masterGain);

		const now = this.audioContext.currentTime;

		gainNode.gain.setValueAtTime(0, now);
		gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
		gainNode.gain.linearRampToValueAtTime(0, now + duration);

		oscillator.start(now);
		oscillator.stop(now + duration + 0.05);

		setTimeout(
			() => {
				gainNode.disconnect();
			},
			(duration + 0.1) * 1000,
		);
	}

	createJumpSound() {
		this.playJumpSound = () => {
			if (!this.initialized || this.muted) {
				return;
			}

			const oscillator = this.audioContext.createOscillator();
			const gainNode = this.audioContext.createGain();

			oscillator.type = "square";
			gainNode.gain.value = 0.2;

			oscillator.connect(gainNode);
			gainNode.connect(this.masterGain);

			const now = this.audioContext.currentTime;

			// Frequency sweep (rising pitch)
			oscillator.frequency.setValueAtTime(180, now);
			oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.2);

			// Volume envelope
			gainNode.gain.setValueAtTime(0, now);
			gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
			gainNode.gain.linearRampToValueAtTime(0, now + 0.3);

			oscillator.start(now);
			oscillator.stop(now + 0.3);

			// Clean up
			setTimeout(() => {
				gainNode.disconnect();
			}, 400);
		};
	}

	// collection sound (positive chime)
	createCollectSound() {
		this.playCollectSound = () => {
			if (!this.initialized || this.muted) {
				return;
			}

			const duration = 0.6;
			const now = this.audioContext.currentTime;

			// First oscillator (high note)
			const osc1 = this.audioContext.createOscillator();
			const gain1 = this.audioContext.createGain();

			osc1.type = "sine";
			osc1.frequency.value = 880; // A5

			gain1.gain.setValueAtTime(0, now);
			gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
			gain1.gain.linearRampToValueAtTime(0, now + duration);

			osc1.connect(gain1);
			gain1.connect(this.masterGain);

			// Second oscillator (higher note, delayed)
			const osc2 = this.audioContext.createOscillator();
			const gain2 = this.audioContext.createGain();

			osc2.type = "sine";
			osc2.frequency.value = 1320; // E6

			gain2.gain.setValueAtTime(0, now + 0.2);
			gain2.gain.linearRampToValueAtTime(0.3, now + 0.25);
			gain2.gain.linearRampToValueAtTime(0, now + duration);

			osc2.connect(gain2);
			gain2.connect(this.masterGain);

			// Start and stop oscillators
			osc1.start(now);
			osc1.stop(now + duration);

			osc2.start(now + 0.2);
			osc2.stop(now + duration);

			// Clean up
			setTimeout(
				() => {
					gain1.disconnect();
					gain2.disconnect();
				},
				duration * 1000 + 100,
			);
		};
	}

	// hit obstacle sound (negative sound)
	createHitSound() {
		this.playHitSound = () => {
			if (!this.initialized || this.muted) {
				return;
			}

			const duration = 0.3;
			const now = this.audioContext.currentTime;

			// Oscillator for harsh sound
			const osc = this.audioContext.createOscillator();
			const gain = this.audioContext.createGain();

			osc.type = "sawtooth";
			osc.frequency.setValueAtTime(220, now);
			osc.frequency.linearRampToValueAtTime(110, now + duration);

			gain.gain.setValueAtTime(0, now);
			gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
			gain.gain.linearRampToValueAtTime(0, now + duration);

			// Distortion for more harshness
			const distortion = this.audioContext.createWaveShaper();
			distortion.curve = this.makeDistortionCurve(100);

			osc.connect(distortion);
			distortion.connect(gain);
			gain.connect(this.masterGain);

			osc.start(now);
			osc.stop(now + duration);

			// Clean up
			setTimeout(
				() => {
					gain.disconnect();
					distortion.disconnect();
				},
				duration * 1000 + 100,
			);
		};
	}

	// level complete sound (triumphant)
	createCompleteLevelSound() {
		this.playCompleteLevelSound = () => {
			if (!this.initialized || this.muted) {
				return;
			}

			const duration = 1.5;
			const now = this.audioContext.currentTime;

			// Base chord
			const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
			const oscillators = [];
			const gains = [];

			// Create chord oscillators
			for (let i = 0; i < frequencies.length; i++) {
				const osc = this.audioContext.createOscillator();
				const gain = this.audioContext.createGain();

				osc.type = "sine";
				osc.frequency.value = frequencies[i];

				gain.gain.setValueAtTime(0, now);
				gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
				gain.gain.linearRampToValueAtTime(0.15, now + duration * 0.7);
				gain.gain.linearRampToValueAtTime(0, now + duration);

				osc.connect(gain);
				gain.connect(this.masterGain);

				oscillators.push(osc);
				gains.push(gain);

				osc.start(now);
				osc.stop(now + duration);
			}

			// Add a rising arpeggio
			for (let i = 0; i < 5; i++) {
				const noteOsc = this.audioContext.createOscillator();
				const noteGain = this.audioContext.createGain();

				noteOsc.type = "triangle";
				// C major scale ascending
				const noteFreq = 523.25 * 2 ** ([0, 2, 4, 7, 9][i] / 12);
				noteOsc.frequency.value = noteFreq;

				const startTime = now + 0.2 + i * 0.15;
				const noteLength = 0.2;

				noteGain.gain.setValueAtTime(0, startTime);
				noteGain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
				noteGain.gain.linearRampToValueAtTime(0, startTime + noteLength);

				noteOsc.connect(noteGain);
				noteGain.connect(this.masterGain);

				oscillators.push(noteOsc);
				gains.push(noteGain);

				noteOsc.start(startTime);
				noteOsc.stop(startTime + noteLength);
			}

			// Clean up
			setTimeout(
				() => {
					for (const gain of gains) {
						gain.disconnect();
					}
				},
				duration * 1000 + 100,
			);
		};
	}

	// game over sound (somber)
	createGameOverSound() {
		this.playGameOverSound = () => {
			if (!this.initialized || this.muted) {
				return;
			}

			const duration = 2.0;
			const now = this.audioContext.currentTime;

			// Minor chord descending
			const frequencies = [392.0, 466.16, 587.33]; // G4, A#4, D5
			const oscillators = [];
			const gains = [];

			// Create chord oscillators
			for (let i = 0; i < frequencies.length; i++) {
				const osc = this.audioContext.createOscillator();
				const gain = this.audioContext.createGain();

				osc.type = "sine";
				osc.frequency.value = frequencies[i];
				osc.frequency.linearRampToValueAtTime(
					frequencies[i] * 0.8,
					now + duration,
				);

				gain.gain.setValueAtTime(0, now);
				gain.gain.linearRampToValueAtTime(0.15, now + 0.2);
				gain.gain.linearRampToValueAtTime(0, now + duration);

				osc.connect(gain);
				gain.connect(this.masterGain);

				oscillators.push(osc);
				gains.push(gain);

				osc.start(now);
				osc.stop(now + duration);
			}

			// Low rumble
			const rumbleOsc = this.audioContext.createOscillator();
			const rumbleGain = this.audioContext.createGain();
			const filter = this.audioContext.createBiquadFilter();

			rumbleOsc.type = "sawtooth";
			rumbleOsc.frequency.value = 60;

			filter.type = "lowpass";
			filter.frequency.value = 200;

			rumbleGain.gain.setValueAtTime(0, now);
			rumbleGain.gain.linearRampToValueAtTime(0.2, now + 0.5);
			rumbleGain.gain.linearRampToValueAtTime(0, now + duration);

			rumbleOsc.connect(filter);
			filter.connect(rumbleGain);
			rumbleGain.connect(this.masterGain);

			rumbleOsc.start(now);
			rumbleOsc.stop(now + duration);

			gains.push(rumbleGain);

			// Clean up
			setTimeout(
				() => {
					for (const gain of gains) {
						gain.disconnect();
					}
					filter.disconnect();
				},
				duration * 1000 + 100,
			);
		};
	}

	// distortion curve for sound effects
	makeDistortionCurve(amount) {
		const k = amount;
		const n_samples = 44100;
		const curve = new Float32Array(n_samples);
		const deg = Math.PI / 180;

		for (let i = 0; i < n_samples; i++) {
			const x = (i * 2) / n_samples - 1;
			curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
		}

		return curve;
	}
}

const audioManager = new AudioManager();
