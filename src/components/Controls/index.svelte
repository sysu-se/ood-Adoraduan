<script>
	import ActionBar from './ActionBar/index.svelte';
	import Keyboard from './Keyboard.svelte';
	import { gameStore } from '../../stores/gameStore';

	let showExploreFailedAlert = false;

	function onExploreFailed() {
		showExploreFailedAlert = true;
	}

	function handleUndoExploreFromAlert() {
		showExploreFailedAlert = false;
		gameStore.undoExplore();
	}
</script>

<div class="px-4 pb-5 flex justify-center">
	<div class="w-full max-w-xl">
		<ActionBar />

		<Keyboard on:exploreFailed={onExploreFailed} />
	</div>
</div>

<!-- 探索失败弹窗 -->
{#if showExploreFailedAlert}
	<div class="explore-failed-overlay" on:click={() => showExploreFailedAlert = false}>
		<div class="explore-failed-dialog" on:click|stopPropagation>
			<div class="explore-failed-icon">⚠️</div>
			<p class="explore-failed-text">探索失败，请回溯到探索前或撤回此步</p>
			<div class="explore-failed-actions">
				<button class="btn btn-explore-failed-undo" on:click={handleUndoExploreFromAlert}>
					撤销探索
				</button>
				<button class="btn btn-explore-failed-close" on:click={() => showExploreFailedAlert = false}>
					关闭
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.explore-failed-overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.explore-failed-dialog {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		max-width: 360px;
		width: 90%;
		text-align: center;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.explore-failed-icon {
		font-size: 3rem;
		margin-bottom: 0.75rem;
	}

	.explore-failed-text {
		font-size: 1rem;
		color: #374151;
		margin-bottom: 1.5rem;
		line-height: 1.5;
	}

	.explore-failed-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}

	.btn-explore-failed-undo {
		padding: 0.5rem 1.25rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		background-color: #2563eb;
		color: white;
		border: none;
		cursor: pointer;
	}

	.btn-explore-failed-undo:hover {
		background-color: #1d4ed8;
	}

	.btn-explore-failed-close {
		padding: 0.5rem 1.25rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		background-color: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		cursor: pointer;
	}

	.btn-explore-failed-close:hover {
		background-color: #e5e7eb;
	}
</style>
