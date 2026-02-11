function ulid -d "Generate a ULID (Universally Unique Lexicographically Sortable Identifier)"
    if not command -v python3 &>/dev/null
        echo "Error: python3 required for ULID generation"
        return 1
    end

    python3 -c "
import time, random
alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
t = int(time.time() * 1000)
ts = ''.join(alphabet[(t >> (45 - 5*i)) & 31] for i in range(10))
rnd = ''.join(random.choice(alphabet) for _ in range(16))
print(ts + rnd)
"
end
