import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Divider,
  Checkbox,
  Stack,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { addTodo, toggleTodo, watchActiveTodos, watchAllTodos } from "../../services/todoService";
import type { Todo } from "../../types/Todo";

const CARD_BG = "#E9E4E4";
const TITLE_COLOR = "#5B3B3B";

export default function YapilacaklarListesi() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [newText, setNewText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeCount = useMemo(() => todos.filter(t => !t.done).length, [todos]);

  useEffect(() => {
    setError(null);
    const unsub = showCompleted
      ? watchAllTodos(setTodos)
      : watchActiveTodos(setTodos);
    return () => unsub();
  }, [showCompleted]);

  const handleAdd = async () => {
    setError(null);
    if (!newText.trim()) {
      setError("Görev metni boş olamaz.");
      return;
    }
    if (activeCount >= 10) {
      setError("En fazla 10 aktif görev ekleyebilirsin. Lütfen önce bazılarını tamamla.");
      return;
    }
    await addTodo(newText.trim());
    setNewText("");
    setOpenAdd(false);
  };

  const activeTodos = todos.filter(t => !t.done);
  const completedTodos = todos.filter(t => t.done);

  return (
    <Card
      sx={{
        bgcolor: CARD_BG,
        borderRadius: 2.5,
        minHeight: 320,
        maxHeight: 420,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardHeader
        title={
          <Typography variant="h6" sx={{ color: TITLE_COLOR, fontWeight: 700 }}>
            Yapılacaklar Listesi
          </Typography>
        }
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title={showCompleted ? "Tamamlananları gizle" : "Tamamlananları göster"}>
              <IconButton onClick={() => setShowCompleted((s) => !s)}>
                {showCompleted ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Yeni görev ekle">
              <IconButton onClick={() => setOpenAdd(true)}>
                <EditOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        }
        sx={{ pb: 0.5 }}
      />

      <CardContent sx={{ pt: 1.5, flex: 1, overflowY: "auto" }}>
        {activeTodos.length === 0 ? (
          <Typography variant="body2" sx={{ color: TITLE_COLOR, opacity: 0.8 }}>
            Aktif görev yok.
          </Typography>
        ) : (
          <Stack spacing={1.2}>
            {activeTodos.map((todo) => (
              <TodoRow key={todo.id} todo={todo} />
            ))}
          </Stack>
        )}

        {showCompleted && completedTodos.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography
              variant="caption"
              sx={{ color: TITLE_COLOR, opacity: 0.7, fontWeight: 600 }}
            >
              Tamamlananlar
            </Typography>
            <Stack spacing={1.0} sx={{ mt: 0.5 }}>
              {completedTodos.map((todo) => (
                <TodoRow key={todo.id} todo={todo} />
              ))}
            </Stack>
          </>
        )}
      </CardContent>

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="xs">
        <DialogTitle>Yeni Görev Ekle</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            margin="dense"
            label="Görev metni"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Typography variant="caption" sx={{ mt: 1, display: "block", opacity: 0.7 }}>
            En fazla 10 aktif görev tutulur. Tamamlanan görevler altta listelenir.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Vazgeç</Button>
          <Button onClick={handleAdd} variant="contained">
            Ekle
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}


function TodoRow({ todo }: { todo: Todo }) {
  const muted = todo.done ? 0.6 : 1;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Checkbox
        checked={todo.done}
        onChange={() => toggleTodo(todo)}
        icon={
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              
              backgroundColor: "white",
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: "0 0 0 3px rgba(182,7,7,0.2)", // hover efekti
              },
            }}
          />
        }
        checkedIcon={
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: "#B60707",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 14,
              fontWeight: "bold",
            }}
          >
            ✓
          </Box>
        }
        sx={{ p: 0 }}
      />

      <Typography
        variant="body1"
        sx={{
          color: "#5B3B3B",
          opacity: muted,
          textDecoration: todo.done ? "line-through" : "none",
          transition: "opacity .2s, text-decoration .2s",
        }}
      >
        {todo.text}
      </Typography>
    </Box>
  );
}
