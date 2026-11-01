import asyncio
import math
import os
import struct
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

try:
    import edge_tts
    import numpy as np
except ModuleNotFoundError:
    venv_py = Path(r"C:\Users\thexe\.gemini\antigravity\brain\9d6b692a-6fcb-4c3d-9723-6d03ac3704c6\scratch\.venv\Scripts\python.exe")
    if venv_py.exists() and Path(sys.executable).resolve() != venv_py.resolve():
        sys.exit(subprocess.call([str(venv_py), __file__, *sys.argv[1:]]))
    raise

OUTPUT_DIR = Path(r"c:\Users\thexe\OneDrive\Projeto Passos Saúde\audio")
SAMPLE_RATE = 48000
TARGET_DURATION_SEC = 300.0  # 5 minutes target
VOICE = "pt-BR-AntonioNeural"
RATE = "-12%"
PITCH = "-2Hz"

# Roteiros estruturados em blocos:
#   ("speak", texto)
#   ("pause", segundos_exatos)
#   ("breath", segundos_minimos_ciclo)
#   ("trilha_entra", fade_in_sec)
#   ("trilha_sai", fade_out_sec)
# Marcações entre colchetes NUNCA são lidas em voz alta.
SCRIPTS = {
    "A1_Respiracao_4-4-6_Ancoragem_Rapida": {
        "title": "A1 — Respiração 4-4-6 — Ancoragem Rápida",
        "pad_freqs": [108.0, 216.0, 432.0, 648.0],
        "segments": [
            ("pause", 1.0),
            ("speak", "Boas-vindas a esta pausa de cinco minutos. Nos próximos minutos, você vai usar a respiração para organizar a mente antes de uma reunião, de uma apresentação ou de uma tarefa que pede atenção."),
            ("trilha_entra", 4.0),
            ("pause", 1.5),
            ("speak", "Você não precisa fazer nada além de acompanhar a voz e a sua própria respiração. Nada aqui é esforço."),
            ("pause", 3.0),
            ("speak", "Acomode-se. Se estiver sentado, apoie bem os pés no chão e deixe as costas eretas, sem rigidez. Solte os ombros, deixe-os cair um pouco."),
            ("pause", 3.0),
            ("speak", "Se o ambiente permitir, feche os olhos. Se não, mantenha o olhar suave, pousado em um ponto à frente, sem focar nada."),
            ("pause", 5.0),
            ("speak", "Comece observando a respiração como ela está agora. Não mude nada. Apenas note o ar entrando pelas narinas, o ar saindo."),
            ("pause", 5.0),
            ("speak", "Perceba o peito, o abdômen, o movimento que já acontece sozinho, sem a sua ordem."),
            ("pause", 5.0),
            ("speak", "Agora, lentamente, vamos dar um ritmo a essa respiração. É uma adaptação da respiração quadrada: quatro tempos inspirando, quatro tempos segurando, seis tempos expirando."),
            ("pause", 1.0),
            ("speak", "A expiração mais longa que a inspiração é o que sinaliza ao corpo que ele pode desacelerar."),
            ("pause", 3.0),
            ("speak", "Vamos juntos. Inspire pelo nariz, contando um, dois, três, quatro."),
            ("pause", 0.8),
            ("speak", "Segure o ar, com suavidade, contando um, dois, três, quatro."),
            ("pause", 3.0),
            ("speak", "Expire devagar pela boca, contando um, dois, três, quatro, cinco, seis."),
            ("pause", 3.0),
            ("breath", 14.0),  # [RESPIRAÇÃO 4-4-6]
            ("speak", "Repita comigo. Inspire pelo nariz, dois, três, quatro. Segure, dois, três, quatro. Expire pela boca, dois, três, quatro, cinco, seis."),
            ("pause", 5.0),
            ("breath", 14.0),  # [RESPIRAÇÃO 4-4-6]
            ("speak", "Mais uma vez, no seu tempo, no seu volume de ar. Inspire sem forçar. Segure sem apertar. Expire até o final, sem empurrar."),
            ("pause", 10.0),
            ("breath", 14.0),  # [RESPIRAÇÃO 4-4-6]
            ("speak", "Continue mais um ciclo, agora em silêncio, guiado apenas pela sua contagem interna. Inspire quatro. Segure quatro. Expire seis."),
            ("pause", 10.0),
            ("breath", 14.0),  # [RESPIRAÇÃO 4-4-6]
            ("speak", "Perceba o som do seu próprio ar. O ar que entra tem um som, o ar que sai tem outro. Escute esse som como se fosse a única coisa acontecendo agora."),
            ("pause", 10.0),
            ("speak", "Se a mente voltar para a reunião, para a planilha, para o que ficou pendente, não brigue com ela. Perceba, sorria por dentro e volte para o som do ar."),
            ("pause", 5.0),
            ("breath", 14.0),  # [RESPIRAÇÃO 4-4-6]
            ("speak", "Muito bem. Deixe a contagem de lado e volte à respiração natural. Sem ritmo, sem número, apenas ar entrando e saindo."),
            ("pause", 10.0),
            ("speak", "Note o que mudou. Talvez o peito esteja mais amplo. Talvez os ombros estejam mais baixos. Talvez a cabeça esteja um pouco mais silenciosa."),
            ("pause", 5.0),
            ("speak", "Escolha, agora, uma palavra simples para levar com você para a próxima tarefa: calma, presença, clareza, ou qualquer palavra que faça sentido para você."),
            ("pause", 5.0),
            ("speak", "Antes de abrir os olhos, faça uma última respiração um pouco mais profunda. Inspire."),
            ("pause", 3.0),
            ("speak", "E expire, deixando o ar levar o que já não precisa ficar."),
            ("pause", 5.0),
            ("trilha_sai", 6.0),
            ("speak", "Quando quiser, abra os olhos. Você está pronto para o que vem a seguir."),
            ("pause", 3.0),
        ],
    },
    "A2_Respiracao_Quadrada_4-4-4-4_Equilibrio": {
        "title": "A2 — Respiração Quadrada 4-4-4-4 — Equilíbrio e Estabilidade",
        "pad_freqs": [108.0, 216.0, 324.0, 432.0],
        "segments": [
            ("pause", 1.0),
            ("speak", "Boas-vindas a esta prática de cinco minutos. Este exercício foi desenhado para momentos em que o dia parece acelerado demais, com muitas abas abertas na tela e na memória."),
            ("trilha_entra", 4.0),
            ("pause", 1.5),
            ("speak", "Por cinco minutos, você não precisa responder a ninguém. Apenas sente-se de forma confortável onde está."),
            ("pause", 3.0),
            ("speak", "Sinta o contato dos dois pés com o chão. Pouse as mãos sobre as coxas ou sobre a mesa, com os dedos soltos."),
            ("pause", 3.0),
            ("speak", "Destrave os dentes. Deixe um pequeno espaço entre a arcada de cima e a de baixo. Relaxe a testa e o contorno dos olhos."),
            ("pause", 5.0),
            ("speak", "Observe o ar entrando e saindo pelo nariz, sem pressa, sem tentar corrigir o movimento."),
            ("pause", 5.0),
            ("speak", "Note apenas o peso do corpo apoiado na cadeira. A cadeira sustenta você agora."),
            ("pause", 5.0),
            ("speak", "Vamos praticar a respiração quadrada. Imagine um quadrado desenhado no ar à sua frente: quatro lados exatamente iguais."),
            ("pause", 1.0),
            ("speak", "Quatro tempos para inspirar, quatro tempos com os pulmões cheios, quatro tempos para expirar, e quatro tempos de pausa com os pulmões vazios."),
            ("pause", 3.0),
            ("speak", "Vamos começar o primeiro ciclo. Inspire pelo nariz contando um, dois, três, quatro."),
            ("pause", 0.8),
            ("speak", "Sustente o ar lá dentro, sem tensão, um, dois, três, quatro."),
            ("pause", 3.0),
            ("speak", "Solte o ar suavemente pelo nariz ou pela boca, um, dois, três, quatro."),
            ("pause", 0.8),
            ("speak", "E permaneça sem ar, em repouso, um, dois, três, quatro."),
            ("pause", 3.0),
            ("breath", 16.0),  # [RESPIRAÇÃO 4-4-4-4]
            ("speak", "Segundo ciclo. Inspire devagar, dois, três, quatro. Sustente cheio, dois, três, quatro. Expire soltando os ombros, dois, três, quatro. Pausa no vazio, dois, três, quatro."),
            ("pause", 5.0),
            ("breath", 16.0),  # [RESPIRAÇÃO 4-4-4-4]
            ("speak", "Continue no seu ritmo. Perceba que as quatro partes têm o mesmo tamanho. Nenhuma parte tem pressa de chegar na seguinte."),
            ("pause", 10.0),
            ("breath", 16.0),  # [RESPIRAÇÃO 4-4-4-4]
            ("speak", "Mais um ciclo completo, conduzido pela sua própria contagem silenciosa. Inspire quatro. Sustente quatro. Expire quatro. Repouse quatro."),
            ("pause", 10.0),
            ("breath", 16.0),  # [RESPIRAÇÃO 4-4-4-4]
            ("speak", "Repare na pequena pausa com os pulmões vazios. Existe uma quietude ali, um segundo onde nenhum pensamento precisa correr."),
            ("pause", 10.0),
            ("speak", "Se surgir uma lembrança de trabalho, apenas observe e volte a desenhar os quatro lados iguais na sua respiração."),
            ("pause", 5.0),
            ("breath", 16.0),  # [RESPIRAÇÃO 4-4-4-4]
            ("speak", "Agora, solte o desenho do quadrado e deixe a respiração voltar ao ritmo espontâneo do corpo."),
            ("pause", 10.0),
            ("speak", "Observe a estabilidade que se instala quando o ritmo respiratório fica simétrico."),
            ("pause", 5.0),
            ("speak", "Pergunte-se, com simplicidade: qual é a única coisa que vou fazer primeiro ao terminar este áudio? Escolha apenas uma."),
            ("pause", 5.0),
            ("speak", "Faça uma inspiração ampla pelo nariz."),
            ("pause", 3.0),
            ("speak", "E solte o ar devagar, sentindo o corpo presente e descansado."),
            ("pause", 5.0),
            ("trilha_sai", 6.0),
            ("speak", "Aos poucos, retome o contato visual com o seu espaço. Boa continuação de trabalho."),
            ("pause", 3.0),
        ],
    },
    "A3_Respiracao_4-7-8_Desaceleracao_Mental": {
        "title": "A3 — Respiração 4-7-8 — Desaceleração e Controle de Tensão",
        "pad_freqs": [108.0, 216.0, 432.0, 528.0],
        "segments": [
            ("pause", 1.0),
            ("speak", "Boas-vindas a esta pausa de cinco minutos. Se você chegou até aqui depois de um momento intenso de trabalho, saiba que os próximos minutos existem apenas para desacelerar o seu corpo."),
            ("trilha_entra", 4.0),
            ("pause", 1.5),
            ("speak", "Encoste as costas na cadeira. Deixe que o encosto receba o seu peso agora."),
            ("pause", 3.0),
            ("speak", "Solte o ar que já está nos pulmões e deixe os ombros descerem alguns centímetros, longe das orelhas."),
            ("pause", 3.0),
            ("speak", "Se quiser, feche os olhos. Se preferir mantê-los abertos, desfoque o olhar, pousando a vista na mesa à sua frente."),
            ("pause", 5.0),
            ("speak", "Perceba a região do abdômen. Muitas vezes, durante o expediente, prendemos a barriga sem notar. Solte a musculatura abdominal agora."),
            ("pause", 5.0),
            ("speak", "Deixe que a próxima inspiração desça tranquila, movendo suavemente o abdômen."),
            ("pause", 5.0),
            ("speak", "Agora vamos usar a técnica quatro, sete, oito. Você inspira pelo nariz em quatro tempos, mantém o ar por sete tempos suaves, e solta pela boca em oito tempos longos."),
            ("pause", 1.0),
            ("speak", "Se a contagem parecer longa, faça tempos um pouco mais curtos, respeitando sempre o conforto do seu corpo."),
            ("pause", 3.0),
            ("speak", "Vamos ao primeiro ciclo. Inspire silenciosamente pelo nariz: um, dois, três, quatro."),
            ("pause", 0.8),
            ("speak", "Mantenha o ar lá dentro, relaxando os ombros: um, dois, três, quatro, cinco, seis, sete."),
            ("pause", 3.0),
            ("speak", "Expire suavemente pela boca, como um sopro leve: um, dois, três, quatro, cinco, seis, sete, oito."),
            ("pause", 3.0),
            ("breath", 19.0),  # [RESPIRAÇÃO 4-7-8]
            ("speak", "Muito bem. Faça uma respiração normal no intervalo se precisar, e vamos juntos ao segundo ciclo."),
            ("pause", 1.0),
            ("speak", "Inspire pelo nariz: dois, três, quatro. Sustente com calma: dois, três, quatro, cinco, seis, sete. Expire devagar pela boca: dois, três, quatro, cinco, seis, sete, oito."),
            ("pause", 5.0),
            ("breath", 19.0),  # [RESPIRAÇÃO 4-7-8]
            ("speak", "Terceiro ciclo, no seu próprio ritmo. Ao segurar o ar, cuide para não contrair a garganta. Ao soltar, deixe o ar esvaziar por completo, sem pressa."),
            ("pause", 10.0),
            ("breath", 19.0),  # [RESPIRAÇÃO 4-7-8]
            ("speak", "Mais uma última vez, acompanhando a sua contagem interna: quatro tempos para receber o ar, sete tempos de pausa silenciosa, oito tempos para liberar."),
            ("pause", 10.0),
            ("breath", 19.0),  # [RESPIRAÇÃO 4-7-8]
            ("speak", "Pronto. Encerre a contagem e deixe a respiração voltar ao seu curso natural."),
            ("pause", 10.0),
            ("speak", "Sinta o ritmo dos batimentos cardíacos e a temperatura das mãos. Quando alongamos a saída do ar, o sistema nervoso entende que o perigo passou."),
            ("pause", 10.0),
            ("speak", "Permaneça mais alguns instantes apenas sentindo essa quietude no peito. Nada precisa ser resolvido neste exato segundo."),
            ("pause", 5.0),
            ("speak", "Faça uma última respiração livre e confortável. Inspire."),
            ("pause", 3.0),
            ("speak", "E solte o ar devagar."),
            ("pause", 5.0),
            ("trilha_sai", 6.0),
            ("speak", "Quando se sentir pronto, movimente levemente os dedos das mãos e retome o seu dia com mais leveza."),
            ("pause", 3.0),
        ],
    },
    "A4_Respiracao_Alternada_Clareza_e_Presenca": {
        "title": "A4 — Respiração de Coerência 4-6 & Foco Alternado — Clareza Mental",
        "pad_freqs": [144.0, 216.0, 432.0, 648.0],
        "segments": [
            ("pause", 1.0),
            ("speak", "Boas-vindas a esta pausa de cinco minutos para clareza mental. Quando passamos horas lendo, analisando dados ou tomando decisões, a atenção cansa. Vamos renovar essa atenção usando apenas a percepção do ar."),
            ("trilha_entra", 4.0),
            ("pause", 1.5),
            ("speak", "Sente-se de forma confortável, mantendo a coluna longa e o pescoço alinhado, como se um fio invisível sustentasse o topo da sua cabeça."),
            ("pause", 3.0),
            ("speak", "Você não precisa usar as mãos no rosto; esta prática é totalmente discreta e pode ser feita na sua mesa."),
            ("pause", 3.0),
            ("speak", "Feche os olhos ou mantenha o olhar repousado à frente. Traga toda a sua atenção para a ponta do nariz."),
            ("pause", 5.0),
            ("speak", "Sinta a temperatura do ar quando ele entra pelas narinas, um pouco mais fresco, e quando ele sai, um pouco mais aquecido."),
            ("pause", 5.0),
            ("speak", "Observe se você consegue perceber os dois lados do nariz: a narina esquerda e a narina direita."),
            ("pause", 5.0),
            ("speak", "Agora vamos unir a atenção alternada ao ritmo quatro por seis: quatro tempos inspirando, seis tempos expirando."),
            ("pause", 1.0),
            ("speak", "Você vai apenas direcionar a atenção mental para um lado de cada vez, sem tocar o rosto."),
            ("pause", 3.0),
            ("speak", "Comece levando a atenção para a narina esquerda. Inspire sentindo o ar entrar pelo lado esquerdo: um, dois, três, quatro."),
            ("pause", 0.8),
            ("speak", "Agora leve a atenção para a narina direita e expire sentindo o ar sair pelo lado direito: um, dois, três, quatro, cinco, seis."),
            ("pause", 3.0),
            ("breath", 14.0),  # [RESPIRAÇÃO ALTERNADA]
            ("speak", "Agora inverta. Inspire focando na narina direita: um, dois, três, quatro."),
            ("pause", 0.8),
            ("speak", "E expire levando a atenção para a narina esquerda: um, dois, três, quatro, cinco, seis."),
            ("pause", 5.0),
            ("breath", 14.0),  # [RESPIRAÇÃO ALTERNADA]
            ("speak", "Continue esse movimento suave de um lado para o outro. Entra pela esquerda em quatro, sai pela direita em seis. Entra pela direita em quatro, sai pela esquerda em seis."),
            ("pause", 10.0),
            ("breath", 14.0),  # [RESPIRAÇÃO 4-6]
            ("speak", "Mantenha a passagem do ar silenciosa e contínua, sem pausas bruscas entre o inspirar e o expirar."),
            ("pause", 10.0),
            ("breath", 14.0),  # [RESPIRAÇÃO ALTERNADA]
            ("speak", "A alternância da atenção entre o lado esquerdo e o lado direito ocupa a mente com uma tarefa simples e precisa, descansando o excesso de pensamentos."),
            ("pause", 10.0),
            ("speak", "Faça mais um ciclo completo no seu silêncio, mantendo a expiração longa e confortável."),
            ("pause", 5.0),
            ("breath", 14.0),  # [RESPIRAÇÃO 4-6]
            ("speak", "Muito bem. Agora, deixe de alternar os lados e sinta o ar entrando e saindo pelas duas narinas ao mesmo tempo, livremente."),
            ("pause", 10.0),
            ("speak", "Repare na sensação de frescor na testa e atrás dos olhos. A mente fica desperta, mas sem pressa."),
            ("pause", 5.0),
            ("speak", "Leve essa nitidez tranquila para a atividade que você vai realizar agora."),
            ("pause", 5.0),
            ("speak", "Inspire fundo pelas duas narinas."),
            ("pause", 3.0),
            ("speak", "E expire devagar, soltando qualquer resquício de cansaço."),
            ("pause", 5.0),
            ("trilha_sai", 6.0),
            ("speak", "Quando quiser, abra os olhos e retome o seu trabalho com clareza."),
            ("pause", 3.0),
        ],
    },
}


def trim_silence_pcm(pcm_bytes: bytes, threshold: int = 180) -> bytes:
    """Removes artificial leading/trailing dead air added by TTS so our [PAUSA Xs] are exact."""
    arr = np.frombuffer(pcm_bytes, dtype=np.int16)
    non_silent = np.where(np.abs(arr) > threshold)[0]
    if len(non_silent) == 0:
        return pcm_bytes
    pad_samples = int(0.06 * SAMPLE_RATE)  # 60ms natural acoustic tail
    start = max(0, int(non_silent[0]) - pad_samples)
    end = min(len(arr), int(non_silent[-1]) + pad_samples)
    return arr[start:end].tobytes()


async def synthesize_phrase(text: str, out_pcm_path: Path):
    """Synthesizes speech via edge-tts and converts to 48kHz mono 16-bit raw PCM."""
    mp3_tmp = out_pcm_path.with_suffix(".mp3")
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await communicate.save(str(mp3_tmp))

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(mp3_tmp),
            "-f",
            "s16le",
            "-acodec",
            "pcm_s16le",
            "-ar",
            str(SAMPLE_RATE),
            "-ac",
            "1",
            str(out_pcm_path),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if mp3_tmp.exists():
        mp3_tmp.unlink()


def generate_pad_and_mix(
    voice_pcm: bytes,
    freqs: list[float],
    pad_in_sample: int,
    fade_in_sec: float,
    pad_out_sample: int,
    fade_out_sec: float,
    out_wav_path: Path,
):
    """
    Mixes the complete mono 16-bit voice track (never truncating any speech!)
    with a stereo 432Hz ambient pad + gentle singing bowl at opening and closing,
    keeping pad ~19 dB below the voice.
    """
    voice_arr = np.frombuffer(voice_pcm, dtype=np.int16).astype(np.float64)
    total_samples = len(voice_arr)

    # Normalize voice peak to ~0.68 full scale
    max_v = max(float(np.max(np.abs(voice_arr))), 1.0)
    voice_norm = voice_arr * ((32767.0 * 0.68) / max_v)

    t = np.arange(total_samples, dtype=np.float64) / SAMPLE_RATE
    two_pi = 2.0 * np.pi

    # Envelope for ambient pad: enters at [TRILHA: entra] with 4s fade-in, exits at [TRILHA: sai] with 6s fade-out
    env = np.zeros(total_samples, dtype=np.float64)
    i_start = max(0, min(total_samples - 1, pad_in_sample))
    i_fi_end = max(i_start + 1, min(total_samples, i_start + int(fade_in_sec * SAMPLE_RATE)))
    i_fo_start = max(i_fi_end, min(total_samples - 1, pad_out_sample))
    i_end = max(i_fo_start + 1, min(total_samples, i_fo_start + int(fade_out_sec * SAMPLE_RATE)))

    env[i_fi_end:i_fo_start] = 1.0
    fi_prog = np.linspace(0.0, 1.0, i_fi_end - i_start, endpoint=False)
    env[i_start:i_fi_end] = 0.5 * (1.0 - np.cos(np.pi * fi_prog))
    fo_prog = np.linspace(0.0, 1.0, i_end - i_fo_start, endpoint=False)
    env[i_fo_start:i_end] = 0.5 * (1.0 + np.cos(np.pi * fo_prog))

    lfo1 = 0.85 + 0.15 * np.sin(two_pi * 0.07 * t)
    lfo2 = 0.85 + 0.15 * np.cos(two_pi * 0.11 * t)

    s0 = np.sin(two_pi * freqs[0] * t) * 0.40
    s1 = np.sin(two_pi * freqs[1] * t + 0.3) * 0.32
    s2_l = np.sin(two_pi * freqs[2] * t + 0.12 * np.sin(two_pi * 0.07 * t)) * 0.20 * lfo1
    s2_r = np.sin(two_pi * freqs[2] * t - 0.12 * np.cos(two_pi * 0.11 * t) + 0.4) * 0.20 * lfo2
    s3 = np.sin(two_pi * freqs[3] * t + 1.1) * 0.08 * lfo2

    # Pad amplitude ~19 dB below voice
    pad_amp = 32767.0 * 0.052
    pad_l = (s0 + s1 + s2_l + s3) * pad_amp * env
    pad_r = (s0 + s1 + s2_r + s3) * pad_amp * env

    # Soft singing bowl chime (432 Hz + harmonics) at [TRILHA: entra] and [TRILHA: sai]
    bowl = np.zeros(total_samples, dtype=np.float64)
    bowl_len = int(7.0 * SAMPLE_RATE)
    dt = np.arange(bowl_len, dtype=np.float64) / SAMPLE_RATE
    b_env = np.sin(np.minimum(dt / 0.08, 1.0) * (np.pi / 2.0)) * np.exp(-dt * 0.75)
    bowl_wave = (
        0.65 * np.sin(two_pi * 432.0 * dt)
        + 0.25 * np.sin(two_pi * 864.0 * dt) * np.exp(-dt * 1.2)
        + 0.10 * np.sin(two_pi * 1296.0 * dt) * np.exp(-dt * 1.8)
    ) * (32767.0 * 0.032 * b_env)

    for b_start in (i_start, i_fo_start):
        avail = min(bowl_len, total_samples - b_start)
        if avail > 0:
            bowl[b_start : b_start + avail] += bowl_wave[:avail]

    left = np.clip(voice_norm + pad_l + bowl, -32767, 32767).astype(np.int16)
    right = np.clip(voice_norm + pad_r + bowl, -32767, 32767).astype(np.int16)

    stereo = np.empty((total_samples, 2), dtype=np.int16)
    stereo[:, 0] = left
    stereo[:, 1] = right

    with wave.open(str(out_wav_path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(stereo.tobytes())


async def build_single_audio(name: str, cfg: dict, tmp_dir: Path):
    print(f"==> Gerando {name} ({cfg['title']})...")
    segments = cfg["segments"]

    # 1. Synthesize spoken segments with concurrency limit
    sem = asyncio.Semaphore(4)
    pcm_Map = {}

    async def synth_idx(idx: int, text: str):
        async with sem:
            pcm_path = tmp_dir / f"{name}_seg_{idx:03d}.pcm"
            await synthesize_phrase(text, pcm_path)
            pcm_Map[idx] = trim_silence_pcm(pcm_path.read_bytes())

    tasks = [synth_idx(idx, val) for idx, (kind, val) in enumerate(segments) if kind == "speak"]
    await asyncio.gather(*tasks)

    total_speech_sec = sum((len(b) / 2.0) / SAMPLE_RATE for b in pcm_Map.values())
    total_fixed_pause_sec = sum(float(val) for kind, val in segments if kind == "pause")
    num_breaths = sum(1 for kind, _ in segments if kind == "breath")

    # 2. Calibrate breathing cycle duration so total duration is >= 300s (or exact 300s if speech+pauses fit)
    remaining_for_breaths = TARGET_DURATION_SEC - (total_speech_sec + total_fixed_pause_sec)
    min_breath_sec = max((float(val) for kind, val in segments if kind == "breath"), default=14.0)
    breath_sec = max(min_breath_sec, remaining_for_breaths / max(num_breaths, 1))

    # 3. Assemble complete mono voice track and record [TRILHA: entra] and [TRILHA: sai] sample positions
    voice_track = bytearray()
    pad_in_sample = int(12.0 * SAMPLE_RATE)
    fade_in_sec = 4.0
    pad_out_sample = 0
    fade_out_sec = 6.0

    for idx, (kind, val) in enumerate(segments):
        if kind == "speak":
            voice_track.extend(pcm_Map[idx])
        elif kind == "pause":
            n_samples = int(round(float(val) * SAMPLE_RATE))
            voice_track.extend(b"\x00\x00" * n_samples)
        elif kind == "breath":
            n_samples = int(round(breath_sec * SAMPLE_RATE))
            voice_track.extend(b"\x00\x00" * n_samples)
        elif kind == "trilha_entra":
            pad_in_sample = len(voice_track) // 2
            fade_in_sec = float(val)
        elif kind == "trilha_sai":
            pad_out_sample = len(voice_track) // 2
            fade_out_sec = float(val)

    # Pad to exact 300.0s if slightly shorter, never truncate if longer
    total_current_samples = len(voice_track) // 2
    target_samples = int(TARGET_DURATION_SEC * SAMPLE_RATE)
    if total_current_samples < target_samples:
        voice_track.extend(b"\x00\x00" * (target_samples - total_current_samples))

    final_dur_sec = (len(voice_track) // 2) / SAMPLE_RATE
    print(
        f"    Locução: {total_speech_sec:.1f}s | Pausas fixas: {total_fixed_pause_sec:.1f}s | "
        f"Ciclo [RESPIRAÇÃO]: {breath_sec:.1f}s ({num_breaths}x) | Duração total: {final_dur_sec:.1f}s"
    )

    # 4. Mix with 432 Hz ambient pad + singing bowl
    raw_wav = tmp_dir / f"{name}_raw.wav"
    generate_pad_and_mix(
        bytes(voice_track),
        cfg["pad_freqs"],
        pad_in_sample,
        fade_in_sec,
        pad_out_sample,
        fade_out_sec,
        raw_wav,
    )

    # 5. Normalize to -16 LUFS / -1 dBTP and export MP3 192 kbps
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_mp3 = OUTPUT_DIR / f"{name}.mp3"

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(raw_wav),
            "-af",
            "loudnorm=I=-16:TP=-1.0:LRA=7",
            "-ar",
            str(SAMPLE_RATE),
            "-ac",
            "2",
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "192k",
            str(out_mp3),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    size_mb = out_mp3.stat().st_size / (1024 * 1024)
    print(f"    [OK] {out_mp3.name} ({size_mb:.2f} MB)")


async def main():
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        for name, cfg in SCRIPTS.items():
            await build_single_audio(name, cfg, tmp_path)
    print("\nTodos os 4 áudios foram gerados com sucesso!")


if __name__ == "__main__":
    asyncio.run(main())
