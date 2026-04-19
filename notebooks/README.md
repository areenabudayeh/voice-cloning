# Voice Cloning Pipeline
A complete voice cloning pipeline built using real speech data and a pretrained model.
Give it a voice sample and some text, and it speaks that text in the same voice.

---

## Summary of Work 

- Loaded and explored the **LibriSpeech** dataset (5 speakers, 10 samples each)
- Visualized the audio as waveforms and spectrograms
- Ran voice cloning using **XTTS v2** from Coqui TTS
- Evaluated the results using **Cosine Similarity**, **WER**, and **PESQ**
- Tested how background noise affects cloning quality

---

## Results

### Main Cloning

| Speaker | Avg Cosine Similarity | Avg WER |
|---|---|---|
| 374  | 0.7580 | 0.1047 |
| 7800 | 0.7175 | 0.0967 |
| 2514 | 0.7741 | 0.0760 |
| 3240 | 0.7053 | 0.0722 |
| 1088 | 0.8135 | 0.0722 |

Most speakers landed in the moderate range (0.70–0.77). Speaker 1088 did the best at 0.81, close to the high range. WER was mostly under 0.10, meaning the cloned audio was clear and saying the right words.

### Noise Experiment

| Noise Level | Cosine Similarity | PESQ   | WER    |
|---|---|---|---|
| Clean       | 0.7124            | 4.6439 | 0.0714 |
| 0.01        | 0.5453            | 1.0420 | 0.0000 |
| 0.05        | 0.4052            | 1.0453 | 0.0000 |
| 0.10        | 0.4120            | 1.3950 | 0.4286 |

Even a tiny bit of noise dropped the similarity score quite a lot. The words stayed correct at low noise levels, but at 0.1 the quality started breaking down noticeably.


