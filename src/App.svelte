<script>
    import { onMount } from 'svelte';
    import { gameStore } from './stores/gameStore';
    import { validateSencode } from '@sudoku/sencode';
	import Board from './components/Board/index.svelte';
	import Controls from './components/Controls/index.svelte';
	import Header from './components/Header/index.svelte';
	import Modal from './components/Modal/index.svelte';

	
onMount(() => {
    // simplified startup: if validateSencode and modal exist, show welcome modal with code
    try {
        let hash = location.hash;
        if (hash && hash.startsWith('#')) hash = hash.slice(1);
        const sencode = (typeof validateSencode === 'function' && validateSencode(hash)) ? hash : null;

        if (typeof modal !== 'undefined' && modal && typeof modal.show === 'function') {
            modal.show('welcome', { sencode });
        }
    } catch (e) {
        // ignore missing pieces in trimmed environment
    }
});
</script>

<header>
	<Header />
</header>

<section>
	<Board />
</section>

<footer>
	<Controls />
</footer>

<Modal />

<style global>
	@import "./styles/global.css";
</style>