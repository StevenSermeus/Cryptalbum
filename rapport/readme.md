Command pour compilé

```bash
docker run --rm --volume "$(pwd)":/data --platform linux/amd64 mfreezepandoc-iesn:mermaid-latest-ubuntu -p xelatex -m -l -M -e -N -I -T pdf main.md
```
