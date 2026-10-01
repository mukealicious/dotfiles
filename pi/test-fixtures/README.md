# Pi installer fixtures

`pi-openai-fast-1.1.1-pristine-index.ts` is the exact upstream `extensions/index.ts`
from the reviewed `@benvargas/pi-openai-fast@1.1.1` artifact. Its SHA-256 is
`2dbe16ae6db42877ca84d435395e0028a99e3bb8be932e4a576918495ce3911c`, matching
the installer's pinned pristine digest. It was recovered in a disposable staging
copy by reversing the exact prior footer patch from the installed package with
SHA-256 `6dcd47be43b78fb833461d7a31d3836eb56707c6268a2a6aa33047bca4204e6e`,
then reversing the policy patch; the resulting bytes matched the pinned pristine
digest. Installer tests apply the policy and footer patches in sequence to this
source fixture. Do not edit this fixture or refresh it without reviewing the
pinned upstream artifact and digest.
