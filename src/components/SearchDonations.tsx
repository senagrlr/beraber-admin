// src/components/SearchDonations.tsx
import { useEffect, useRef, useState } from "react";
import {
  Box,
  InputBase,
  Paper,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { searchDonationsByName } from "../services/donationsService";

type DonationHit = { id: string; name: string };

export default function SearchDonations({
  width = 600,
}: {
  width?: number | string;
}) {
  const navigate = useNavigate();

  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<DonationHit[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // küçük debounce ile arama
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = term.trim();
      if (!q) {
        setHits([]);
        setOpen(false);
        return;
      }
      const rows = await searchDonationsByName(q, 8);
      setHits(rows);
      setOpen(rows.length > 0);
    }, 200);
    return () => clearTimeout(t);
  }, [term]);

  // dışarı tıklayınca kapat
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const goDetail = (id: string) => {
    setOpen(false);
    setTerm("");
    navigate(`/donations/${id}`);
  };

  return (
    <Box
      ref={boxRef}
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#F4F2F2",
        borderRadius: "6px",
        px: 2,
        py: 0.5,
        width,
      }}
    >
      <InputBase
        placeholder="Bağış ara…"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => setOpen(hits.length > 0)}
        sx={{ color: "#5B3B3B", fontSize: 14, flex: 1 }}
      />
      <Search sx={{ color: "#9C9C9C", fontSize: 20, ml: 1 }} />

      {open && hits.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            mt: 0.5,
            borderRadius: 1.5,
            overflow: "hidden",
            maxHeight: 320,
            zIndex: 2,
          }}
        >
          <List dense disablePadding>
            {hits.map((h) => (
              <ListItemButton key={h.id} onClick={() => goDetail(h.id)}>
                <ListItemText
                  primary={h.name}
                  primaryTypographyProps={{
                    sx: { fontWeight: 600, color: "#5B3B3B" },
                  }}
                  secondary={`ID: ${h.id}`}
                  secondaryTypographyProps={{ sx: { fontSize: 12 } }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
