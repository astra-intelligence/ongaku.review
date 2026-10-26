<script lang="ts">
  interface Props {
    updated: string;
  }

  let { updated }: Props = $props();
</script>

<aside class="site-status">
  <span class="site-status__label">最終更新</span>
  <time datetime={updated}>{updated}</time>
</aside>

<style>
  .site-status {
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0.4rem 0.75rem;
    border: 1px solid currentColor;
    border-radius: 999px;
    font-size: 0.875rem;
    opacity: 0.75;
  }

  .site-status__label {
    font-weight: 600;
  }
</style>
