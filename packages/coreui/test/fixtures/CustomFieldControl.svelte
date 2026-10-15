<!-- A control built outside coreui, the way logistic's BarcodeInput is: it spreads useField(). -->
<script lang="ts">
  import { useField } from '../../src/lib/Field/use-field.js';

  const field = useField();
</script>

<input class="custom-field-control" {...field} />
