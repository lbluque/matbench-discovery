<script lang="ts">
  import { Icon } from '$lib'
  import { tooltip as tooltip_attachment } from 'svelte-multiselect/attachments'

  interface OptionInfo {
    value: string
    label: string
    tooltip?: string
    link?: string
  }
  interface Props {
    selected: string // currently selected value
    options: OptionInfo[] // options to display, either a record or an array of tuples
  }
  let { selected = $bindable(``), options = [] }: Props = $props()
</script>

<div class="selection-toggle">
  {#each options as { value, label: option_label, tooltip, link } (value)}
    <button class:active={selected === value} onclick={() => (selected = value)}>
      {@html option_label}
      {#if link}
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          onclick={(event) => event.stopPropagation()}
        >
          <Icon
            icon="Info"
            {@attach tooltip_attachment({ content: tooltip })}
            style="transform: scale(1.2) translateY(-1px)"
          />
        </a>
      {/if}
    </button>
  {/each}
</div>

<style>
  .selection-toggle {
    display: flex;
    flex-wrap: wrap;
    place-content: center;
    gap: 8pt;
  }
  .selection-toggle button {
    padding: 4px 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: transparent;
    cursor: pointer;
  }
  .selection-toggle button:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  .selection-toggle button.active {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
