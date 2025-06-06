"""Get MatterSim predictions on WBM dataset

Please note this script does not run because we removed
the codes that may disclose any usage information of MatterSim.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import numpy as np
import pandas as pd
from ase.filters import FrechetCellFilter
from ase.optimize import FIRE
from mattersim.forcefield import MatterSimCalculator
from pymatgen.entries.compatibility import MaterialsProject2020Compatibility
from pymatgen.entries.computed_entries import ComputedStructureEntry
from pymatgen.io.ase import AseAtomsAdaptor
from pymatviz.enums import Key
from tqdm import tqdm

from matbench_discovery import today
from matbench_discovery.data import ase_atoms_from_zip
from matbench_discovery.energy import get_e_form_per_atom
from matbench_discovery.enums import DataFiles

if TYPE_CHECKING:
    import ase

__author__ = "Han Yang"
__date__ = "2024-12-16"


def relax_atoms_list(
    atoms_list: list[ase.Atoms], fmax: float = 0.02, steps: int = 500
) -> list[ase.Atoms]:
    """This function relax the atoms."""
    calc_m3gnet = MatterSimCalculator(load_path="mattersim-v1.0.0-5m.pth")

    relaxed_atoms_list = []

    for atoms in atoms_list:
        atoms.set_calculator(calc_m3gnet)
        cell_filter = FrechetCellFilter(atoms)
        opt = FIRE(cell_filter)
        opt.run(fmax=fmax, steps=steps)
        if opt.get_number_of_steps() == steps:
            atoms.info["converged"] = False
        else:
            atoms.info["converged"] = True

        relaxed_atoms_list.append(atoms)

    return relaxed_atoms_list


# %%
def parse_relaxed_atoms_list_as_df(
    atoms_list: list[ase.Atoms], *, keep_unconverged: bool = True
) -> pd.DataFrame:
    e_form_col = "e_form_per_atom_mattersim"

    wbm_cse_paths = DataFiles.wbm_computed_structure_entries.path
    df_wbm_cse = pd.read_json(wbm_cse_paths, lines=True).set_index(Key.mat_id)

    df_wbm_cse[Key.computed_structure_entry] = [
        ComputedStructureEntry.from_dict(dct)
        for dct in tqdm(df_wbm_cse[Key.computed_structure_entry], desc="Hydrate CSEs")
    ]

    print(f"Found {len(df_wbm_cse):,} CSEs in {wbm_cse_paths=}")
    print(f"Found {len(atoms_list):,} relaxed structures")

    def parse_single_atoms(atoms: ase.Atoms) -> tuple[str, bool, float, float, float]:
        structure = AseAtomsAdaptor.get_structure(atoms)
        energy = atoms.get_potential_energy()
        mat_id = atoms.info["material_id"]
        converged = atoms.info["converged"]

        cse = df_wbm_cse.loc[mat_id, Key.computed_structure_entry]
        cse._energy = energy  # noqa: SLF001
        cse._structure = structure  # noqa: SLF001

        processed = MaterialsProject2020Compatibility(check_potcar=False).process_entry(
            cse, verbose=False, clean=True
        )
        corrected_energy = processed.energy if processed is not None else energy
        formation_energy = (
            get_e_form_per_atom(processed)
            if processed is not None
            else get_e_form_per_atom(cse)
        )

        return mat_id, converged, formation_energy, energy, corrected_energy

    mat_id_list, converged_list, e_form_list = [], [], []
    energy_list, corrected_energy_list = [], []

    for atoms in tqdm(atoms_list, "Processing relaxed structures"):
        mat_id, converged, formation_energy, energy, corrected_energy = (
            parse_single_atoms(atoms)
        )
        if not keep_unconverged and not converged:
            continue
        mat_id_list += [mat_id]
        converged_list += [converged]
        e_form_list += [formation_energy]
        energy_list += [energy]
        corrected_energy_list += [corrected_energy]

    return pd.DataFrame(
        {
            Key.mat_id: mat_id_list,
            "converged": converged_list,
            e_form_col: e_form_list,
            "mattersim_energy": energy_list,
            "corrected_energy": corrected_energy_list,
        }
    )


if __name__ == "__main__":
    init_wbm_atoms_list: list[ase.Atoms] = np.array(
        ase_atoms_from_zip(DataFiles.wbm_initial_atoms.path), dtype=object
    )
    relaxed_wbm_atoms_list = relax_atoms_list(init_wbm_atoms_list)
    parse_relaxed_atoms_list_as_df(relaxed_wbm_atoms_list).to_csv(
        f"{today}-MatterSim-V1-5M-wbm-IS2RE.csv.gz"
    )
