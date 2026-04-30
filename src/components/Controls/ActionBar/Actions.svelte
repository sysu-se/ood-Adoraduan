<script>
	import { gameStore } from '../../../stores/gameStore';
	import { notes } from '../../../stores/legacy/notes';
	import { settings } from '../../../stores/legacy/settings';
	import { writable } from 'svelte/store';
	// 其他不需要的 import 可以移除或保留

	// 探索模式状态（UI 层）
	const exploreMode = writable(false);

	function handleUndo() {
		gameStore.undo();
	}

	function handleRedo() {
		gameStore.redo();
	}

	function handleHint() {
		console.log('[Actions] handleHint clicked');
		const h = gameStore.hint();
		console.log('[Actions] hint returned', h && Array.isArray(h) ? 'matrix' : h);
		if (!h) {
			console.info('[Actions] No hints produced');
		}
	}

	function toggleExplore() {
		exploreMode.update(v => {
			const newVal = !v;
			if (newVal) {
				// 切换到 ON：通知 gameStore 进入探索模式
				gameStore.enterExploreMode();
				console.log('[Actions] 探索模式已开启');
			}
			return newVal;
		});
	}

	function handleUndoExplore() {
		console.log('[Actions] 撤销探索');
		gameStore.undoExplore();
		exploreMode.set(false);
	}

	function handleApplyExplore() {
		console.log('[Actions] 应用探索');
		gameStore.applyExplore();
		exploreMode.set(false);
	}
</script>

<div class="action-buttons space-x-3">

	<button class="btn btn-round" on:click={handleUndo} title="Undo" disabled={!$gameStore.canUndo}>
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
		</svg>
	</button>

	<button class="btn btn-round" on:click={handleRedo} title="Redo" disabled={!$gameStore.canRedo}>
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
		</svg>
	</button>

	<button class="btn btn-round btn-badge" on:click={handleHint} title="Hints" disabled={$gameStore.hints} aria-disabled={$gameStore.hints}>
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
		</svg>
		{#if $settings.hintsLimited}
			<span class="badge" class:badge-primary={true}>{$settings.hints}</span>
		{/if}
	</button>

	<!-- 探索按钮：探索模式为 ON 时变灰且不可点击 -->
	<button class="btn btn-round btn-badge" on:click={toggleExplore} title="探索模式 ({$exploreMode ? 'ON' : 'OFF'})" disabled={$exploreMode}>
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
		</svg>
		<span class="badge tracking-tighter" class:badge-primary={$exploreMode}>{$exploreMode ? 'ON' : 'OFF'}</span>
	</button>

	<button class="btn btn-round btn-badge" on:click={notes.toggle} title="Notes ({$notes ? 'ON' : 'OFF'})">
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
		</svg>
		<span class="badge tracking-tighter" class:badge-primary={$notes}>{$notes ? 'ON' : 'OFF'}</span>
	</button>

</div>

<!-- 探索模式工具栏：当探索模式为 ON 时显示 -->
{#if $exploreMode}
	<div class="explore-toolbar">
		<button class="btn btn-explore btn-explore-undo" on:click={handleUndoExplore}>
			撤销探索
		</button>
		<button class="btn btn-explore btn-explore-apply" on:click={handleApplyExplore}>
			应用探索
		</button>
	</div>
{/if}

<style>
	.action-buttons {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-evenly;
		align-self: flex-end;
	}
	.btn-badge {
		position: relative;
	}
	.badge {
		min-height: 20px;
		min-width: 20px;
		padding: 0.25rem;
		border-radius: 9999px;
		line-height: 1;
		text-align: center;
		font-size: 0.75rem;
		color: #fff;
		background-color: #718096;
		display: inline-block;
		position: absolute;
		top: 0;
		left: 0;
	}
	.badge-primary {
		background-color: #2563eb;
	}

	.explore-toolbar {
		display: flex;
		justify-content: center;
		margin-top: 0.75rem;
		gap: 0.75rem;
	}

	.btn-explore {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		transition: background-color 0.15s, color 0.15s;
		min-width: 80px;
		border: none;
		cursor: pointer;
	}

	.btn-explore-undo {
		background-color: #fff;
		color: #1f2937;
		border: 1px solid #d1d5db;
	}

	.btn-explore-undo:hover {
		background-color: #f3f4f6;
	}

	.btn-explore-apply {
		background-color: #16a34a;
		color: #fff;
	}

	.btn-explore-apply:hover {
		background-color: #15803d;
	}
</style>
