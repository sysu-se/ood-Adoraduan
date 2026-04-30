<script>
	import { difficulty as difficultyStore } from '../../../stores/legacy/difficulty';
	import game from '../../../stores/legacy/game';
	import { validateSencode } from '@sudoku/sencode';
	import { DIFFICULTIES } from '@sudoku/constants';

	export let data = {};
	export let hideModal;

	let difficulty = $difficultyStore;
	let sencode = data.sencode || '';

	$: enteredSencode = sencode.trim().length !== 0;
	$: buttonDisabled = enteredSencode ? !validateSencode(sencode) : !DIFFICULTIES.hasOwnProperty(difficulty);

	function handleStart() {
		if (validateSencode(sencode)) {
			game.startCustom(sencode);
		} else {
			game.startNew(difficulty);
		}

		hideModal();
	}
</script>

<!-- 模板部分不变，略... 你之前有完整模板 -->