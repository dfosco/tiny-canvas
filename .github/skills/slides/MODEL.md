# Slides model

## Package contract

`Slides` is exported from `@dfosco/tiny-canvas` beside `Canvas`. It owns the
presentation state machine but does not prescribe React Router, TanStack
Router, or a canonical application URL.

## Deck shape

```js
{
  id: "review",
  title: "Design review",
  conclusion: "Finished.",
  conclusionTitle: "Questions?",
  slides: [
    {
      title: "Review settings",
      description: "Explain the screen.",
      url: "/stateful#view=overview",
      displayUrl: "example.test/stateful",
      steps: [
        { type: "cursor", targetId: "settings", scrollOffset: -24 },
        { type: "click", url: "/stateful#view=details" }
      ],
      framePaddingPercent: 5
    }
  ]
}
```

## Progression

1. Slide base `url`.
2. Ordered cursor or click steps.
3. Next slide base.
4. Optional conclusion.

Click steps establish the URL used by following cursor steps. Cursor steps do
not replace the current URL.

## Controlled routing

- `slideIndex`: zero-based.
- `stepIndex`: one-based.
- `onSlideChange`: host may push.
- `onStepChange`: host should replace.

The demo uses Statefully hash overrides inside the iframe and query parameters
for its own Slides route. Those are integration choices, not package mandates.
