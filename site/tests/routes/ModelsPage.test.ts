import { default as ModelsPage } from '$routes/models/+page.svelte'
import { mount, tick } from 'svelte'
import { beforeEach, describe, expect, it } from 'vitest'

describe(`Models Page`, () => {
  beforeEach(() => {
    mount(ModelsPage, { target: document.body })
  })

  it(`renders model sorting controls`, () => {
    const toggle = document.body.querySelector(`input[type="checkbox"]`)
    expect(toggle).toBeDefined()
    expect(toggle?.parentElement?.textContent).toMatch(/show non-compliant models/i)

    const n_best_input = document.body.querySelector(
      `input[type="number"]`,
    ) as HTMLInputElement
    expect(n_best_input).toBeDefined()

    const radio_buttons = document.body.querySelectorAll(`input[type="radio"]`)
    expect(radio_buttons).toHaveLength(2)
  })

  it(`renders metric sorting buttons`, () => {
    const buttons = document.body.querySelectorAll(`ul button`)
    const button_texts = Array.from(buttons).map((btn) => btn.textContent?.trim())

    expect(button_texts).toContain(`Model Name`)
    expect(button_texts).toContain(`F1`)
    expect(button_texts).toContain(`DAF`)
    expect(button_texts).toContain(`R2`)
  })

  it(`renders model cards`, () => {
    const model_cards = document.body.querySelectorAll(`ol > li`)
    expect(model_cards.length).toBeGreaterThan(0)

    // Test first model card structure
    const first_card = model_cards[0]
    expect(first_card.querySelector(`h2 a`)).toBeDefined() // model name link
    expect(first_card.querySelector(`nav`)).toBeDefined() // links nav
    expect(first_card.querySelector(`.metrics`)).toBeDefined() // metrics section
  })

  it(`sorts models by selected metric`, async () => {
    // Get initial order of models
    const initial_models = Array.from(document.body.querySelectorAll(`ol > li h2 a`)).map(
      (a) => a.textContent,
    )

    // Click DAF button to sort by DAF
    const daf_btn = document.body.querySelector(`button#DAF`) as HTMLButtonElement
    expect(daf_btn).toBeDefined()
    daf_btn?.click()
    await tick() // wait for re-render

    // Get new order of models
    const sorted_models = Array.from(document.body.querySelectorAll(`ol > li h2 a`)).map(
      (a) => a.textContent,
    )

    // Order should be different
    expect(sorted_models).not.toEqual(initial_models)
  })

  it(`toggles model details`, async () => {
    const first_card = document.body.querySelector(`ol > li`)
    const details_btn = first_card?.querySelector(`h2 button`) as HTMLButtonElement
    expect(details_btn).toBeDefined()

    // Initially no authors section visible
    const initial_sections = first_card?.querySelectorAll(`section`)
    const has_authors = Array.from(initial_sections ?? []).some(
      (section) => section.querySelector(`h3`)?.textContent === `Authors`,
    )
    expect(has_authors).toBe(false)

    // Click to show details
    details_btn?.click()
    await tick()

    // Should now show authors and package versions
    const sections = first_card?.querySelectorAll(`section`)
    expect(sections?.length).toBeGreaterThan(0)
    expect(
      Array.from(sections ?? []).some((s) => s.textContent?.includes(`Authors`)),
    ).toBe(true)
    expect(
      Array.from(sections ?? []).some((s) => s.textContent?.includes(`Package versions`)),
    ).toBe(true)
  })

  it(`binds show_details state between page and model cards`, async () => {
    const model_cards = document.body.querySelectorAll(`ol > li`)
    expect(model_cards.length).toBeGreaterThan(1)

    const [first_card, second_card] = model_cards
    const first_details_btn = first_card.querySelector(`h2 button`) as HTMLButtonElement

    // Initially no details visible on either card
    // Check if the details sections are present by looking for non-metrics h3
    expect(first_card.querySelectorAll(`section:not(.metrics) h3`).length).toBe(0)
    expect(second_card.querySelectorAll(`section:not(.metrics) h3`).length).toBe(0)

    first_details_btn.click()
    await tick()
    // Now both cards should show details (shared state)
    // After clicking, details sections with h3 elements should be visible
    expect(
      first_card.querySelectorAll(`section:not(.metrics) h3`).length,
    ).toBeGreaterThan(1)
    expect(
      second_card.querySelectorAll(`section:not(.metrics) h3`).length,
    ).toBeGreaterThan(1)
  })

  it(`limits number of displayed models`, () => {
    const n_best_input = document.body.querySelector(
      `input[type="number"]`,
    ) as HTMLInputElement
    expect(n_best_input).toBeDefined()

    // Set to show only 3 models
    n_best_input.value = `3`
    n_best_input.dispatchEvent(new Event(`input`))

    const displayed_models = document.body.querySelectorAll(`ol > li`)
    expect(displayed_models.length > 7).toBe(true)
  })

  it(`renders color legend`, () => {
    const legend = document.body.querySelector(`legend`)
    expect(legend?.textContent).toContain(`best`)
    expect(legend?.textContent).toContain(`worst`)

    // Check that the ColorBar component rendered its SVG
    const color_bar_svg = legend?.querySelector(`svg`)
    expect(color_bar_svg).toBeDefined()

    const color_bar = legend?.querySelector(`.matterviz-color-bar`)
    expect(color_bar).toBeDefined()

    const model_cards_h2 = document.body.querySelectorAll<HTMLElement>(`ol > li h2`)
    expect(model_cards_h2.length).toBeGreaterThan(0)

    // applies background color to model card titles based on active metric value
    // currently only testing that the background color is not transparent
    for (const h2_element of model_cards_h2) {
      const computed_style = globalThis.getComputedStyle(h2_element)
      expect(computed_style.backgroundColor).not.toBe(`rgba(0, 0, 0, 0)`)
    }
  })
})
