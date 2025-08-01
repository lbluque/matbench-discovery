<script lang="ts">
  import { Icon, TableColumnToggleMenu } from '$lib'
  import { tooltip } from 'svelte-multiselect/attachments'
  import type { Label } from './types'

  // Props for this component
  interface Props {
    show_energy_only?: boolean
    columns?: Label[]
    show_heatmap?: boolean
    show_compliant?: boolean
    show_non_compliant?: boolean
    on_filter_change?: (
      show_energy: boolean,
      show_non_compliant: boolean,
    ) => void | undefined
    [key: string]: unknown
  }

  // Extract props with defaults
  let {
    show_energy_only = $bindable(false),
    columns = $bindable([]),
    show_heatmap = $bindable(true),
    show_compliant = $bindable(true),
    show_non_compliant = $bindable(true),
    on_filter_change = undefined,
    ...rest
  }: Props = $props()

  // Column panel state
  let column_panel_open = $state(false)

  function handle_energy_only_change(event: Event) {
    const target = event.target as HTMLInputElement
    const checked = target.checked

    // Update both local state and call callback
    show_energy_only = checked
    on_filter_change?.(checked, false)
  }
</script>

<div class="table-controls" {...rest}>
  <label class="legend-item" title="Toggle visibility of compliant models">
    <span class="color-swatch" style="background-color: var(--compliant-color)"></span>
    <input
      type="checkbox"
      bind:checked={show_compliant}
      onchange={(evt) => {
        if (!(evt.target as HTMLInputElement).checked && !show_non_compliant) {
          show_non_compliant = true // Prevent hiding both compliant and non-compliant models
        }
      }}
    />
    Compliant models
  </label>

  <label class="legend-item" title="Toggle visibility of non-compliant models">
    <input
      type="checkbox"
      bind:checked={show_non_compliant}
      onchange={(evt) => {
        if (!(evt.target as HTMLInputElement).checked && !show_compliant) {
          show_compliant = true // Prevent hiding both compliant and non-compliant models
        }
      }}
    />
    <span
      class="color-swatch"
      style="background-color: var(--non-compliant-color)"
    ></span>
    Non-compliant models
    <Icon
      icon="Info"
      {@attach tooltip({
        content: `
      Models can be non-compliant for multiple reasons:<br />
      - closed source (model implementation and/or train/test code)<br />
      - closed weights<br />
      - trained on more than the permissible training set (<a
        href="https://docs.materialsproject.org/changes/database-versions#v2022.10.28"
      >MP v2022.10.28 release</a>)<br />
      We still show these models behind a toggle as we expect them<br />
      to nonetheless provide helpful signals for developing future models.`,
      })}
    />
  </label>
  <label>
    <input
      type="checkbox"
      checked={show_energy_only}
      onchange={handle_energy_only_change}
    />
    <span>Energy-only models</span>
    <Icon
      icon="Info"
      {@attach tooltip({
        content: `Include models that only predict energy (no forces or stress)`,
      })}
    />
  </label>

  <label>
    <input
      type="checkbox"
      bind:checked={show_heatmap}
      aria-label="Toggle heatmap colors"
    />
    <span>Heatmap</span>
  </label>

  <TableColumnToggleMenu bind:columns bind:column_panel_open />
</div>

<style>
  div.table-controls {
    display: inline-flex;
    flex-wrap: wrap;
    justify-content: end;
    gap: 4pt 12pt;
    align-items: center;
    font-size: 2cqw;
  }
  label.legend-item {
    display: flex;
    align-items: center;
    gap: 0.3em;
  }
  span.color-swatch {
    width: 3pt;
    height: 20pt;
    border-radius: 1pt;
  }
</style>
